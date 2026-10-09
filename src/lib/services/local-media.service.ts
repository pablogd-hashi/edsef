import fs from "fs/promises";
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
import type { MediaType, SectionType } from "@prisma/client";
import { mediaService } from "./media.service";
import { generateImageVariants } from "@/lib/inbox/heic";

const MAX_IMAGE = Number(process.env.MAX_IMAGE_SIZE ?? 20 * 1024 * 1024);
const MAX_VIDEO = Number(process.env.MAX_VIDEO_SIZE ?? 500 * 1024 * 1024);
const MAX_OTHER = 50 * 1024 * 1024;

function mimeToType(mime: string, filename: string): MediaType {
  const ext = path.extname(filename).replace(/^\./, "").toLowerCase();
  if (["mov", "mp4", "m4v", "webm", "avi", "mkv", "3gp"].includes(ext)) return "VIDEO";

  const resolved = inferMimeType(filename, mime);
  if (resolved.startsWith("video/")) return "VIDEO";
  if (resolved.startsWith("image/")) return "IMAGE";
  if (resolved.startsWith("audio/")) return "AUDIO";
  if (["heic", "heif", "jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "IMAGE";
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
      storyId?: string;
      parentNoteId?: string;
      sectionType?: SectionType;
      title?: string;
    }
  ) {
    const {
      file,
      childId,
      yearbookId,
      milestoneId,
      timelineEntryId,
      storyId,
      parentNoteId,
      sectionType,
      title,
    } = params;

    const canEdit = await accessService.assertParentAccess(userId, childId);
    if (!canEdit) throw new Error("Forbidden");
    await assertLinksBelongToChild(childId, {
      yearbookId,
      milestoneId,
      timelineEntryId,
      storyId,
      parentNoteId,
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    return this.uploadFromBuffer(familyId, {
      buffer,
      filename: file.name,
      mimeType: file.type || undefined,
      childId,
      yearbookId,
      milestoneId,
      timelineEntryId,
      storyId,
      parentNoteId,
      sectionType,
      title,
    });
  }

  async uploadFromBuffer(
    familyId: string,
    params: {
      buffer: Buffer;
      filename: string;
      mimeType?: string;
      childId: string;
      yearbookId?: string;
      milestoneId?: string;
      timelineEntryId?: string;
      storyId?: string;
      parentNoteId?: string;
      sectionType?: SectionType;
      title?: string;
      capturedAt?: Date;
      sourcePath?: string;
    }
  ) {
    const {
      buffer,
      filename,
      childId,
      yearbookId,
      milestoneId,
      timelineEntryId,
      storyId,
      parentNoteId,
      sectionType,
      title,
      capturedAt,
      sourcePath,
    } = params;

    const mimeType = inferMimeType(filename, params.mimeType);
    const type = mimeToType(mimeType, filename);

    if (type === "IMAGE" && buffer.length > MAX_IMAGE) {
      throw new Error(`Image too large (max ${MAX_IMAGE / 1024 / 1024}MB)`);
    }
    if (type === "VIDEO" && buffer.length > MAX_VIDEO) {
      throw new Error(`Video too large (max ${MAX_VIDEO / 1024 / 1024}MB)`);
    }
    if ((type === "AUDIO" || type === "DOCUMENT") && buffer.length > MAX_OTHER) {
      throw new Error(`File too large (max ${MAX_OTHER / 1024 / 1024}MB)`);
    }

    const ext = sanitizeExtension(filename, mimeType);
    const checksum = computeSha256(buffer);

    const asset = await mediaService.create({
      childId,
      yearbookId,
      type,
      originalFilename: filename,
      mimeType,
      size: BigInt(buffer.length),
      storageKey: "pending",
      title: title ?? filename,
      capturedAt,
      checksum,
    });

    let updated;
    try {
      updated = await this.storeFiles(familyId, childId, asset.id, {
        buffer,
        ext,
        type,
        checksum,
        sourcePath,
      });
    } catch (error) {
      // Never leave a half-imported asset behind: no row, no stray files.
      await prisma.mediaAsset.delete({ where: { id: asset.id } }).catch(() => {});
      await fs
        .rm(path.dirname(getAssetFilePath(familyId, childId, asset.id, "original", ext)), {
          recursive: true,
          force: true,
        })
        .catch(() => {});
      throw error;
    }

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

    if (yearbookId && (storyId || parentNoteId || sectionType)) {
      const count = await prisma.attachment.count({
        where: {
          yearbookId,
          ...(storyId ? { storyId } : {}),
          ...(parentNoteId ? { parentNoteId } : {}),
          ...(sectionType ? { sectionType } : {}),
        },
      });
      await prisma.attachment.create({
        data: {
          yearbookId,
          mediaId: asset.id,
          order: count,
          storyId,
          parentNoteId,
          sectionType,
        },
      });
    }

    return updated;
  }

  private async storeFiles(
    familyId: string,
    childId: string,
    assetId: string,
    opts: { buffer: Buffer; ext: string; type: string; checksum: string; sourcePath?: string }
  ) {
    const { buffer, ext, type, checksum, sourcePath } = opts;
    const originalPath = getAssetFilePath(familyId, childId, assetId, "original", ext);
    const storageKey = path.relative(STORAGE_ROOT, originalPath);

    await saveBuffer(originalPath, buffer);

    let width: number | undefined;
    let height: number | undefined;

    if (type === "IMAGE") {
      const variants = await generateImageVariants(buffer, sourcePath);
      width = variants.width;
      height = variants.height;

      if (variants.webBuf && variants.thumbBuf) {
        const webPath = getAssetFilePath(familyId, childId, assetId, "web", "jpg");
        const thumbPath = getAssetFilePath(familyId, childId, assetId, "thumbnail", "jpg");
        await saveBuffer(webPath, variants.webBuf);
        await saveBuffer(thumbPath, variants.thumbBuf);

        await mediaService.addVariant(assetId, "WEB", {
          storageKey: path.relative(STORAGE_ROOT, webPath),
          mimeType: "image/jpeg",
          size: BigInt(variants.webBuf.length),
          width: variants.width,
          height: variants.height,
          checksum: computeSha256(variants.webBuf),
        });
        await mediaService.addVariant(assetId, "THUMBNAIL", {
          storageKey: path.relative(STORAGE_ROOT, thumbPath),
          mimeType: "image/jpeg",
          size: BigInt(variants.thumbBuf.length),
          width: 400,
          height: 400,
          checksum: computeSha256(variants.thumbBuf),
        });
      }
    }

    return prisma.mediaAsset.update({
      where: { id: assetId },
      data: {
        storageKey,
        checksum,
        width,
        height,
        processingStatus: "READY",
      },
      include: { variants: true },
    });
  }

  async delete(userId: string, mediaId: string): Promise<void> {
    const asset = await mediaService.getById(mediaId);
    if (!asset) throw new Error("Not found");

    const canEdit = await accessService.assertParentAccess(userId, asset.childId);
    if (!canEdit) throw new Error("Forbidden");

    await prisma.milestoneMedia.deleteMany({ where: { mediaId } });
    await prisma.timelineEntryMedia.deleteMany({ where: { mediaId } });
    await prisma.attachment.deleteMany({ where: { mediaId } });
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

/** Every record an upload links to must hang off the same child (no cross-family injection). */
async function assertLinksBelongToChild(
  childId: string,
  ids: {
    yearbookId?: string;
    milestoneId?: string;
    timelineEntryId?: string;
    storyId?: string;
    parentNoteId?: string;
  }
): Promise<void> {
  const owned = { yearbook: { childId } };
  const checks: Promise<unknown>[] = [];
  if (ids.yearbookId) checks.push(prisma.yearbook.findFirst({ where: { id: ids.yearbookId, childId } }));
  if (ids.milestoneId) checks.push(prisma.milestone.findFirst({ where: { id: ids.milestoneId, ...owned } }));
  if (ids.timelineEntryId)
    checks.push(prisma.timelineEntry.findFirst({ where: { id: ids.timelineEntryId, ...owned } }));
  if (ids.storyId) checks.push(prisma.story.findFirst({ where: { id: ids.storyId, ...owned } }));
  if (ids.parentNoteId)
    checks.push(prisma.parentNote.findFirst({ where: { id: ids.parentNoteId, ...owned } }));

  const found = await Promise.all(checks);
  if (found.some((row) => !row)) throw new Error("Forbidden");
}

export const localMediaService = new LocalMediaService();
