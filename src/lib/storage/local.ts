import fs from "fs/promises";
import path from "path";
import type { MediaType } from "@prisma/client";

export const STORAGE_ROOT = path.resolve(
  process.env.STORAGE_PATH ?? path.join(process.cwd(), "storage")
);

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function saveBuffer(filePath: string, buffer: Buffer): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, buffer);
}

export function getAssetFilePath(
  familyId: string,
  childId: string,
  assetId: string,
  variant: "original" | "web" | "thumbnail",
  ext: string
): string {
  return path.join(
    STORAGE_ROOT,
    "media",
    familyId,
    childId,
    assetId,
    `${variant}.${ext.replace(/^\./, "")}`
  );
}

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/x-msvideo": "avi",
};

export function sanitizeExtension(filename: string, mimeType?: string): string {
  const fromName = path.extname(filename).replace(/^\./, "").toLowerCase();
  if (fromName && /^[a-z0-9]{1,8}$/.test(fromName)) return fromName;
  if (mimeType && MIME_EXT[mimeType]) return MIME_EXT[mimeType];
  return "bin";
}

export function exportAssetFilename(
  assetId: string,
  type: MediaType,
  ext: string
): string {
  const cleanExt = ext.replace(/^\./, "");
  const folder = type === "VIDEO" ? "assets/videos" : "assets/images";
  return `${folder}/${assetId}.${cleanExt}`;
}
