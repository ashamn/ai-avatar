import { FileType } from "lucide-react";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import {
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { env } from "@/env.mjs";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/utils/s3";
import { TRPCError } from "@trpc/server";

export const getAllUserImagesSignedUrls = async (userId: string) => {
  const pathToImages = `uploads/${userId}`;
  const data = await s3.send(
    new ListObjectsV2Command({
      Bucket: env.AWS_BUCKET_NAME,
      Prefix: pathToImages,
    })
  );

  if (!data || !data?.Contents?.length) {
    return {
      uploadedImagesWithKey: [],
    };
  }

  const dataFiltered = data.Contents.map((photo) => photo.Key).filter(
    (key) => !key?.endsWith(".zip")
  );

  const allImagesSignedUrls = await Promise.all(
    dataFiltered.map((key) =>
      getSignedUrl(
        s3,
        new GetObjectCommand({
          Key: key,
          Bucket: env.AWS_BUCKET_NAME,
        }),
        { expiresIn: 60 * 5 }
      )
    )
  );

  return {
    uploadedImagesWithKey: allImagesSignedUrls.map((url, i) => ({
      url,
      key: data.Contents![i]?.Key,
    })),
  };
};

export const storageRouter = createTRPCRouter({
  getUploadUrls: protectedProcedure
    .input(
      z.object({
        images: z.array(
          z.object({
            imageId: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx: { session }, input: { images } }) => {
      const putCommands = images.map((img) => {
        const key = `uploads/${session.user.id}/${img.imageId}.jpeg`;
        return new PutObjectCommand({
          Bucket: env.AWS_BUCKET_NAME,
          Key: key,
          ContentType: "image/jpeg",
        });
      });

      const getSignedUrls = await Promise.all(
        putCommands.map((command) => {
          return getSignedUrl(s3, command, { expiresIn: 60 * 2 });
        })
      );

      return getSignedUrls;
    }),
  getAllUserUploadedImages: protectedProcedure.query(
    async ({ ctx: { session } }) => {
      const imageSignedUrls = await getAllUserImagesSignedUrls(session.user.id);
      return imageSignedUrls;
    }
  ),
  removeImageFromS3: protectedProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ input: { key } }) => {
      const deleteObjCommand = new DeleteObjectCommand({
        Bucket: env.AWS_BUCKET_NAME,
        Key: key,
      });

      try {
        await s3.send(deleteObjCommand);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "something wrong deleting the image",
        });
      }
    }),
});
