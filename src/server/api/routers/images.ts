import { createTRPCRouter, protectedProcedure } from "../trpc";
import smartcrop from "smartcrop-sharp";
import { getAllUserImagesSignedUrls } from "./storage";
import axios from "axios";
import sharp from "sharp";
import JSZip from "jszip";
import { s3 } from "@/utils/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/env.mjs";

const WIDTH = 512;
const HEIGHT = 512;
const zip = new JSZip();

export const imagesRouter = createTRPCRouter({
  startProcessingImages: protectedProcedure.mutation(
    async ({ ctx: { session, prisma } }) => {
      const images = await getAllUserImagesSignedUrls(session.user.id);

      const folder = zip.folder("data");

      for (const imgObj of images.uploadedImagesWithKey) {
        const response = await axios.get(imgObj.url, {
          responseType: "arraybuffer",
        });

        const result = await smartcrop.crop(response.data, {
          width: WIDTH,
          height: HEIGHT,
        });
        const photoBuffer = await sharp(response.data)
          .extract({
            width: result.topCrop.width,
            height: result.topCrop.height,
            left: result.topCrop.x,
            top: result.topCrop.y,
          })
          .resize(WIDTH, HEIGHT)
          .toBuffer();

        if (imgObj.key) folder?.file(imgObj.key, photoBuffer, { binary: true });
      }

      const zipFile = await folder?.generateAsync({
        type: "nodebuffer",
      });

      await s3.send(
        new PutObjectCommand({
          Bucket: env.AWS_BUCKET_NAME,
          Key: `uploads/${session.user.id}/data.zip`,
          ContentType: "application/zip",
          Body: zipFile,
        })
      );
    }
  ),
});
