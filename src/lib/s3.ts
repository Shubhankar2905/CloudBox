import { S3Client } from "@aws-sdk/client-s3";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getS3Bucket() {
  return getRequiredEnv("S3_BUCKET");
}

export function getS3Client() {
  return new S3Client({
    region: getRequiredEnv("AWS_REGION"),
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  });
}
