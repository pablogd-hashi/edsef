import { createHash } from "crypto";

export function computeSha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function computeSha256FromStream(
  stream: NodeJS.ReadableStream
): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of stream) {
    hash.update(chunk as Buffer);
  }
  return hash.digest("hex");
}

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export function isAllowedMimeType(
  mimeType: string,
  category: "image" | "video" | "document"
): boolean {
  const allowed = {
    image: ALLOWED_IMAGE_TYPES,
    video: ALLOWED_VIDEO_TYPES,
    document: ALLOWED_DOCUMENT_TYPES,
  }[category];
  return (allowed as readonly string[]).includes(mimeType);
}
