import { S3Client } from "@aws-sdk/client-s3";

export function createS3Client(): S3Client {
  const endpoint = process.env.S3_ENDPOINT;
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";

  return new S3Client({
    region: process.env.S3_REGION ?? "us-east-1",
    endpoint: endpoint || undefined,
    forcePathStyle,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY ?? "",
      secretAccessKey: process.env.S3_SECRET_KEY ?? "",
    },
  });
}

export const S3_BUCKET = process.env.S3_BUCKET ?? "memoria-media";

export function buildStorageKey(
  familyId: string,
  childId: string,
  assetId: string,
  variant: string,
  extension: string
): string {
  return `families/${familyId}/children/${childId}/assets/${assetId}/${variant}.${extension}`;
}
