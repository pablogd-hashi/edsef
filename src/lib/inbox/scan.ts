import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db/prisma";
import { accessService } from "@/lib/services/access.service";
import { mediaService } from "@/lib/services/media.service";
import { yearbookService } from "@/lib/services/yearbook.service";
import { timelineService } from "@/lib/services/timeline.service";
import { localMediaService } from "@/lib/services/local-media.service";
import { computeSha256 } from "@/lib/storage/checksum";
import { inferMimeType } from "@/lib/storage/local";
import { extractCapturedAt } from "./exif";
import { resolveChildForFile, type InboxChild } from "./match-child";
import {
  IMPORTED_DIR,
  isPlaceholderName,
  resolveInboxPath,
  titleFromFilename,
} from "./paths";

const STABLE_MS = 5_000;
const MEDIA_EXT = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "heic",
  "heif",
  "mov",
  "mp4",
  "m4v",
  "webm",
]);

export type InboxScanResult = {
  file: string;
  status: "imported" | "skipped" | "duplicate" | "unassigned" | "error";
  reason?: string;
  timelineEntryId?: string;
};

type PendingFile = {
  absPath: string;
  relative: string;
  folderName: string | null;
  filename: string;
};

export async function scanInbox(inboxPath = resolveInboxPath()): Promise<InboxScanResult[]> {
  const family = await prisma.family.findFirst({
    include: {
      members: { where: { role: { in: ["OWNER", "PARENT"] } }, orderBy: { createdAt: "asc" } },
      children: { where: { deletedAt: null, status: "ACTIVE" } },
    },
  });

  if (!family) {
    return [{ file: inboxPath, status: "skipped", reason: "No family in database" }];
  }

  const ownerId = family.members[0]?.userId;
  if (!ownerId) {
    return [{ file: inboxPath, status: "skipped", reason: "No parent account" }];
  }

  const children: InboxChild[] = family.children.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    nickname: c.nickname,
  }));

  let files: PendingFile[];
  try {
    files = await listPendingFiles(inboxPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Inbox not readable";
    return [{ file: inboxPath, status: "error", reason: message }];
  }

  const results: InboxScanResult[] = [];
  for (const file of files) {
    results.push(await importOne(file, { familyId: family.id, ownerId, children, inboxPath }));
  }
  return results;
}

async function listPendingFiles(inboxPath: string): Promise<PendingFile[]> {
  const entries = await fs.readdir(inboxPath, { withFileTypes: true });
  const files: PendingFile[] = [];

  for (const entry of entries) {
    if (entry.name === IMPORTED_DIR) continue;
    if (isPlaceholderName(entry.name)) continue;

    if (entry.isDirectory()) {
      const nested = await fs.readdir(path.join(inboxPath, entry.name), { withFileTypes: true });
      for (const child of nested) {
        if (!child.isFile() || isPlaceholderName(child.name)) continue;
        files.push({
          absPath: path.join(inboxPath, entry.name, child.name),
          relative: path.join(entry.name, child.name),
          folderName: entry.name,
          filename: child.name,
        });
      }
      continue;
    }

    if (entry.isFile()) {
      files.push({
        absPath: path.join(inboxPath, entry.name),
        relative: entry.name,
        folderName: null,
        filename: entry.name,
      });
    }
  }

  return files;
}

async function importOne(
  file: PendingFile,
  ctx: { familyId: string; ownerId: string; children: InboxChild[]; inboxPath: string }
): Promise<InboxScanResult> {
  const ext = path.extname(file.filename).replace(/^\./, "").toLowerCase();
  if (!MEDIA_EXT.has(ext)) {
    return { file: file.relative, status: "skipped", reason: "Unsupported type" };
  }

  const stat = await fs.stat(file.absPath);
  if (stat.size === 0) {
    return { file: file.relative, status: "skipped", reason: "Empty file" };
  }
  if (Date.now() - stat.mtimeMs < STABLE_MS) {
    return { file: file.relative, status: "skipped", reason: "Still downloading" };
  }

  const child = resolveChildForFile(file.folderName, ctx.children);
  if (!child) {
    return { file: file.relative, status: "unassigned", reason: "No matching child folder" };
  }

  const buffer = await fs.readFile(file.absPath);
  const checksum = computeSha256(buffer);
  const existing = await mediaService.findByChecksum(checksum);
  if (existing) {
    await archiveImported(ctx.inboxPath, file);
    return { file: file.relative, status: "duplicate", reason: "Already imported" };
  }

  const capturedAt = extractCapturedAt(buffer, stat.mtime);
  const yearbook = await yearbookService.getOrCreateCurrent(child.id, ctx.ownerId, capturedAt);
  const title = titleFromFilename(file.filename);

  const entry = await timelineService.create(
    {
      yearbookId: yearbook.id,
      title,
      description: "Imported from iCloud",
      eventDate: capturedAt,
      month: capturedAt.getMonth() + 1,
    },
    (
      await prisma.child.findUniqueOrThrow({
        where: { id: child.id },
        select: { birthDate: true },
      })
    ).birthDate
  );

  await localMediaService.uploadFromBuffer(ctx.familyId, {
    buffer,
    filename: file.filename,
    mimeType: inferMimeType(file.filename),
    childId: child.id,
    yearbookId: yearbook.id,
    timelineEntryId: entry.id,
    title,
    capturedAt,
    sourcePath: file.absPath,
  });

  await accessService.logAudit(
    "inbox.import",
    ctx.ownerId,
    ctx.familyId,
    "TimelineEntry",
    entry.id,
    {
      childId: child.id,
      yearbookId: yearbook.id,
      timelineEntryId: entry.id,
      filename: file.filename,
    }
  );

  await archiveImported(ctx.inboxPath, file);
  return { file: file.relative, status: "imported", timelineEntryId: entry.id };
}

async function archiveImported(inboxPath: string, file: PendingFile) {
  const destDir = path.join(
    inboxPath,
    IMPORTED_DIR,
    file.folderName ?? "_root"
  );
  await fs.mkdir(destDir, { recursive: true });
  let dest = path.join(destDir, file.filename);
  try {
    await fs.access(dest);
    const parsed = path.parse(file.filename);
    dest = path.join(destDir, `${parsed.name}-${Date.now()}${parsed.ext}`);
  } catch {
    // dest is free
  }
  await fs.rename(file.absPath, dest);
}
