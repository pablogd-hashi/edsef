import path from "path";
import { prisma } from "@/lib/db/prisma";
import { accessService } from "@/lib/services/access.service";
import { computeSha256 } from "@/lib/storage/checksum";
import {
  getAssetFilePath,
  saveBuffer,
  sanitizeExtension,
  inferMimeType,
  STORAGE_ROOT,
} from "@/lib/storage/local";
import sharp from "sharp";
import type { MediaType } from "@prisma/client";
import { mediaService } from "./media.service";

const MAX_IMAGE = Number(process.env.MAX_IMAGE_SIZE ?? 20 * 1024 * 1024);
const MAX_VIDEO = Number(process.env.MAX_VIDEO_SIZE ?? 500 * 1024 * 1024);

function mimeToType(mime: string, filename: string): MediaType {
  const resolved = inferMimeType(filename, mime);
  if (resolved.startsWith("image/")) return "IMAGE";
  if (resolved.startsWith("video/")) return "VIDEO";
  if (resolved.startsWith("audio/")) return "AUDIO";
  const ext = path.extname(filename).replace(/^\./, "").toLowerCase();
  if (["heic", "heif", "jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "IMAGE";
  if (["mov", "mp4", "m4v", "webm"].includes(ext)) return "VIDEO";
  return "DOCUMENT";
}

export class LocalMediaService {
  async upload(
    userId: string,
    familyId: string,
    params: {
      file: File;
      childId: string;
      yearbookId?: string;
      milestoneId?: string;
      timelineEntryId?: string;
      title?: string;
    }
  ) {
    const { file, childId, yearbookId, milestoneId, timelineEntryId, title } = params;

    const canAccess = await accessService.assertChildAccess(userId, childId);
    if (!canAccess) throw new Error("Forbidden");

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = inferMimeType(file.name, file.type || undefined);
    const type = mimeToType(mimeType, file.name);

    if (type === "IMAGE" && buffer.length > MAX_IMAGE) {
      throw new Error(`Image too large (max ${MAX_IMAGE / 1024 / 1024}MB)`);
    }
    if (type === "VIDEO" && buffer.length > MAX_VIDEO) {
      throw new Error(`Video too large (max ${MAX_VIDEO / 1024 / 1024}MB)`);
    }

    const ext = sanitizeExtension(file.name, mimeType);
    const checksum = computeSha256(buffer);

    const asset = await mediaService.create({
      childId,
      yearbookId,
      type,
      originalFilename: file.name,
      mimeType,
      size: BigInt(buffer.length),
      storageKey: "pending",
      title: title ?? file.name,
    });

    const originalPath = getAssetFilePath(familyId, childId, asset.id, "original", ext);
    const storageKey = path.relative(STORAGE_ROOT, originalPath);

    await saveBuffer(originalPath, buffer);

    let width: number | undefined;
    let height: number | undefined;

    if (type === "IMAGE") {
      try {
        const meta = await sharp(buffer).metadata();
        width = meta.width;
        height = meta.height;

        const webBuf = await sharp(buffer)
          .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
        const thumbBuf = await sharp(buffer)
          .resize(400, 400, { fit: "cover" })
          .jpeg({ quality: 80 })
          .toBuffer();

        const webPath = getAssetFilePath(familyId, childId, asset.id, "web", "jpg");
        const thumbPath = getAssetFilePath(familyId, childId, asset.id, "thumbnail", "jpg");
        await saveBuffer(webPath, webBuf);
        await saveBuffer(thumbPath, thumbBuf);

        await mediaService.addVariant(asset.id, "WEB", {
          storageKey: path.relative(STORAGE_ROOT, webPath),
          mimeType: "image/jpeg",
          size: BigInt(webBuf.length),
          width: (await sharp(webBuf).metadata()).width,
          height: (await sharp(webBuf).metadata()).height,
          checksum: computeSha256(webBuf),
        });
        await mediaService.addVariant(asset.id, "THUMBNAIL", {
          storageKey: path.relative(STORAGE_ROOT, thumbPath),
          mimeType: "image/jpeg",
          size: BigInt(thumbBuf.length),
          width: 400,
          height: 400,
          checksum: computeSha256(thumbBuf),
        });
      } catch {
        // keep original only
      }
    }

    const updated = await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: {
        storageKey,
        checksum,
        width,
        height,
        processingStatus: "READY",
      },
      include: { variants: true },
    });

    if (milestoneId) {
      const count = await prisma.milestoneMedia.count({ where: { milestoneId } });
      await prisma.milestoneMedia.create({
        data: { milestoneId, mediaId: asset.id, order: count },
      });
    }

    if (timelineEntryId) {
      const count = await prisma.timelineEntryMedia.count({
        where: { timelineEntryId },
      });
      await prisma.timelineEntryMedia.create({
        data: { timelineEntryId, mediaId: asset.id, order: count },
      });
    }

    return updated;
  }

  async delete(userId: string, mediaId: string): Promise<void> {
    const asset = await mediaService.getById(mediaId);
    if (!asset) throw new Error("Not found");

    const canEdit = await accessService.assertParentAccess(userId, asset.childId);
    if (!canEdit) throw new Error("Forbidden");

    await prisma.milestoneMedia.deleteMany({ where: { mediaId } });
    await prisma.timelineEntryMedia.deleteMany({ where: { mediaId } });
    await prisma.mediaAsset.update({
      where: { id: mediaId },
      data: { deletedAt: new Date() },
    });
  }

  resolvePath(storageKey: string): string {
    return path.join(STORAGE_ROOT, storageKey);
  }

  getReadablePath(
    asset: { storageKey: string; variants?: { variant: string; storageKey: string }[] },
    variant: "original" | "web" | "thumbnail" = "web"
  ): string {
    if (variant !== "original" && asset.variants?.length) {
      const v = asset.variants.find((x) => x.variant === variant.toUpperCase());
      if (v) return this.resolvePath(v.storageKey);
    }
    return this.resolvePath(asset.storageKey);
  }
}

export const localMediaService = new LocalMediaService();
