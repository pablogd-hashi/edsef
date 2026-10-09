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
  FAILED_DIR,
  IMPORTED_DIR,
  isPlaceholderName,
  resolveInboxPath,
  titleFromFilename,
} from "./paths";

/** Give up on a file after this many failed import attempts and park it in .failed/. */
const MAX_ATTEMPTS = 3;

/**
 * iCloud keeps the original mtime when it downloads a file, so "old mtime"
 * doesn't mean "finished". A file is importable once its size and mtime are
 * unchanged between two scans. State lives for the watcher's lifetime.
 */
const lastSeen = new Map<string, string>();
const attempts = new Map<string, number>();

export function resetInboxState() {
  lastSeen.clear();
  attempts.clear();
}
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
    birthDate: c.birthDate,
  }));

  let files: PendingFile[];
  try {
    files = await listPendingFiles(inboxPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Inbox not readable";
    return [{ file: inboxPath, status: "error", reason: message }];
  }

  const ctx = { familyId: family.id, ownerId, children, inboxPath };
  const results: InboxScanResult[] = [];
  for (const file of files) {
    // One bad file must never stop the rest of the inbox from importing.
    try {
      const result = await importOne(file, ctx);
      if (result.status !== "skipped") attempts.delete(file.absPath);
      results.push(result);
    } catch (error) {
      results.push(await recordFailure(file, inboxPath, error));
    }
  }
  return results;
}

async function listPendingFiles(inboxPath: string): Promise<PendingFile[]> {
  const entries = await fs.readdir(inboxPath, { withFileTypes: true });
  const files: PendingFile[] = [];

  for (const entry of entries) {
    if (entry.name === IMPORTED_DIR || entry.name === FAILED_DIR) continue;
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
  const fingerprint = `${stat.size}:${stat.mtimeMs}`;
  const previous = lastSeen.get(file.absPath);
  lastSeen.set(file.absPath, fingerprint);
  if (previous !== fingerprint) {
    return { file: file.relative, status: "skipped", reason: "Waiting for download to settle" };
  }

  const child = resolveChildForFile(file.folderName, ctx.children);
  if (!child) {
    return { file: file.relative, status: "unassigned", reason: "No matching child folder" };
  }

  const buffer = await fs.readFile(file.absPath);
  const checksum = computeSha256(buffer);
  const existing = await mediaService.findByChecksum(checksum, ctx.familyId);
  if (existing) {
    lastSeen.delete(file.absPath);
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
    child.birthDate ?? (await prisma.child.findUniqueOrThrow({ where: { id: child.id } })).birthDate
  );

  try {
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
  } catch (error) {
    // No empty "Imported from iCloud" entries when the photo itself failed.
    await prisma.timelineEntry.delete({ where: { id: entry.id } }).catch(() => {});
    throw error;
  }

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

  lastSeen.delete(file.absPath);
  await archiveImported(ctx.inboxPath, file);
  return { file: file.relative, status: "imported", timelineEntryId: entry.id };
}

async function recordFailure(
  file: PendingFile,
  inboxPath: string,
  error: unknown
): Promise<InboxScanResult> {
  const reason = error instanceof Error ? error.message : String(error);
  const count = (attempts.get(file.absPath) ?? 0) + 1;
  attempts.set(file.absPath, count);
  if (count < MAX_ATTEMPTS) {
    return { file: file.relative, status: "error", reason: `${reason} (attempt ${count})` };
  }

  attempts.delete(file.absPath);
  lastSeen.delete(file.absPath);
  try {
    const dest = await moveInto(path.join(inboxPath, FAILED_DIR, file.folderName ?? "_root"), file);
    await fs.writeFile(`${dest}.error.txt`, `${new Date().toISOString()}\n${reason}\n`);
  } catch {
    // If even moving fails, leave it in place; it will be retried.
  }
  return { file: file.relative, status: "error", reason: `${reason} — moved to ${FAILED_DIR}/` };
}

async function archiveImported(inboxPath: string, file: PendingFile) {
  await moveInto(path.join(inboxPath, IMPORTED_DIR, file.folderName ?? "_root"), file);
}

async function moveInto(destDir: string, file: PendingFile): Promise<string> {
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
  return dest;
}
