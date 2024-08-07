import { env } from "@/env.mjs";
import { S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: "ap-southeast-2",
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY,
    secretAccessKey: env.AWS_SECRET_KEY,
  },
});
