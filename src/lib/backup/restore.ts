import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db/prisma";
import { computeSha256 } from "@/lib/storage/checksum";
import { STORAGE_ROOT, ensureDir, fileExists } from "@/lib/storage/local";
import type { BackupDatabaseSnapshot, BackupManifest, RestoreResult } from "./types";
import { BACKUP_SCHEMA_VERSION } from "./types";

export async function restoreFamilyBackup(
  familyId: string,
  backupDir: string
): Promise<RestoreResult> {
  const manifestPath = path.join(backupDir, "manifest.json");
  const databasePath = path.join(backupDir, "database.json");

  if (!(await fileExists(manifestPath))) {
    throw new Error("manifest.json not found in backup");
  }
  if (!(await fileExists(databasePath))) {
    throw new Error("database.json not found in backup");
  }

  const manifest = JSON.parse(
    await fs.readFile(manifestPath, "utf-8")
  ) as BackupManifest;

  if (manifest.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error(`Unsupported backup schema: ${manifest.schemaVersion}`);
  }

  if (manifest.familyId !== familyId) {
    throw new Error("Backup belongs to a different family");
  }

  let verifiedChecksums = 0;
  for (const file of manifest.files) {
    const filePath = path.join(backupDir, file.path);
    if (!(await fileExists(filePath))) {
      if (file.path === "database.json") throw new Error("database.json missing");
      continue;
    }
    if (file.checksum) {
      const actual = computeSha256(await fs.readFile(filePath));
      if (actual !== file.checksum) {
        throw new Error(`Checksum mismatch for ${file.path}`);
      }
      verifiedChecksums++;
    }
  }

  const storageBackupDir = path.join(backupDir, "storage");
  let restoredFiles = 0;
  if (await fileExists(storageBackupDir)) {
    restoredFiles = await copyStorageTree(storageBackupDir, STORAGE_ROOT);
  }

  const snapshot = JSON.parse(
    await fs.readFile(databasePath, "utf-8")
  ) as BackupDatabaseSnapshot;

  const { restoredChildren, restoredYearbooks } = await restoreDatabaseSnapshot(
    familyId,
    snapshot
  );

  return { restoredFiles, restoredChildren, restoredYearbooks, verifiedChecksums };
}

async function copyStorageTree(srcDir: string, destRoot: string): Promise<number> {
  let count = 0;

  async function walk(current: string) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(srcPath);
      } else {
        const rel = path.relative(srcDir, srcPath);
        const destPath = path.join(destRoot, rel);
        await ensureDir(path.dirname(destPath));
        await fs.copyFile(srcPath, destPath);
        count++;
      }
    }
  }

  await walk(srcDir);
  return count;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

async function restoreDatabaseSnapshot(
  familyId: string,
  snapshot: BackupDatabaseSnapshot
): Promise<{ restoredChildren: number; restoredYearbooks: number }> {
  let restoredYearbooks = 0;

  await prisma.$transaction(async (tx) => {
    for (const loc of snapshot.locations as AnyRecord[]) {
      const { id, name, city, country, latitude, longitude } = loc;
      await tx.location.upsert({
        where: { id },
        create: { id, name, city, country, latitude, longitude, familyId },
        update: { name, city, country, latitude, longitude, familyId },
      });
    }

    for (const tag of snapshot.tags as AnyRecord[]) {
      const { id, name, color } = tag;
      await tx.tag.upsert({
        where: { id },
        create: { id, name, color, familyId },
        update: { name, color, familyId },
      });
    }

    for (const person of snapshot.people as AnyRecord[]) {
      const { id, name, relation } = person;
      await tx.person.upsert({
        where: { id },
        create: { id, name, relation, familyId },
        update: { name, relation, familyId },
      });
    }

    for (const child of snapshot.children as AnyRecord[]) {
      const { yearbooks, mediaAssets, id, fullName, nickname, birthDate, profilePhotoId, themeColor, titleFont, description, status, createdById, updatedById, deletedAt } = child;

      await tx.child.upsert({
        where: { id },
        create: {
          id,
          fullName,
          nickname,
          familyId,
          birthDate: new Date(birthDate),
          profilePhotoId,
          themeColor,
          titleFont,
          description,
          status,
          createdById,
          updatedById,
          deletedAt: deletedAt ? new Date(deletedAt) : null,
        },
        update: {
          fullName,
          nickname,
          birthDate: new Date(birthDate),
          profilePhotoId,
          themeColor,
          titleFont,
          description,
          status,
          createdById,
          updatedById,
          deletedAt: deletedAt ? new Date(deletedAt) : null,
        },
      });

      for (const asset of (mediaAssets ?? []) as AnyRecord[]) {
        await restoreMediaAsset(tx, asset, id);
      }

      for (const yearbook of (yearbooks ?? []) as AnyRecord[]) {
        await restoreYearbook(tx, yearbook, id);
        restoredYearbooks++;
      }
    }
  });

  return { restoredChildren: snapshot.children.length, restoredYearbooks };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function restoreMediaAsset(tx: any, asset: AnyRecord, childId: string) {
  const { variants, ...data } = asset;
  await tx.mediaAsset.upsert({
    where: { id: data.id },
    create: {
      ...data,
      childId,
      size: BigInt(data.size),
      uploadedAt: data.uploadedAt ? new Date(data.uploadedAt) : new Date(),
      capturedAt: data.capturedAt ? new Date(data.capturedAt) : null,
      deletedAt: data.deletedAt ? new Date(data.deletedAt) : null,
    },
    update: {
      ...data,
      size: BigInt(data.size),
      capturedAt: data.capturedAt ? new Date(data.capturedAt) : null,
      deletedAt: data.deletedAt ? new Date(data.deletedAt) : null,
    },
  });

  for (const variant of (variants ?? []) as AnyRecord[]) {
    await tx.mediaVariant.upsert({
      where: { mediaId_variant: { mediaId: data.id, variant: variant.variant } },
      create: {
        ...variant,
        size: BigInt(variant.size),
      },
      update: {
        ...variant,
        size: BigInt(variant.size),
      },
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function restoreYearbook(tx: any, yearbook: AnyRecord, childId: string) {
  const {
    sections,
    stories,
    milestones,
    timeline,
    music,
    parentNotes,
    futureLetter,
    attachments,
    mediaAssets,
    ...data
  } = yearbook;

  await tx.yearbook.upsert({
    where: { id: data.id },
    create: {
      ...data,
      childId,
      periodStart: data.periodStart ? new Date(data.periodStart) : null,
      periodEnd: data.periodEnd ? new Date(data.periodEnd) : null,
      deletedAt: data.deletedAt ? new Date(data.deletedAt) : null,
    },
    update: {
      ...data,
      periodStart: data.periodStart ? new Date(data.periodStart) : null,
      periodEnd: data.periodEnd ? new Date(data.periodEnd) : null,
      deletedAt: data.deletedAt ? new Date(data.deletedAt) : null,
    },
  });

  for (const section of (sections ?? []) as AnyRecord[]) {
    await tx.section.upsert({
      where: { id: section.id },
      create: section,
      update: section,
    });
  }

  for (const story of (stories ?? []) as AnyRecord[]) {
    await tx.story.upsert({
      where: { id: story.id },
      create: {
        ...story,
        yearbookId: data.id,
        deletedAt: story.deletedAt ? new Date(story.deletedAt) : null,
      },
      update: {
        ...story,
        deletedAt: story.deletedAt ? new Date(story.deletedAt) : null,
      },
    });
  }

  for (const milestone of (milestones ?? []) as AnyRecord[]) {
    const { media, tags, people, ...mData } = milestone;
    await tx.milestone.upsert({
      where: { id: mData.id },
      create: {
        ...mData,
        yearbookId: data.id,
        eventDate: mData.eventDate ? new Date(mData.eventDate) : null,
        deletedAt: mData.deletedAt ? new Date(mData.deletedAt) : null,
      },
      update: {
        ...mData,
        eventDate: mData.eventDate ? new Date(mData.eventDate) : null,
        deletedAt: mData.deletedAt ? new Date(mData.deletedAt) : null,
      },
    });

    for (const link of (media ?? []) as AnyRecord[]) {
      await tx.milestoneMedia.upsert({
        where: {
          milestoneId_mediaId: {
            milestoneId: mData.id,
            mediaId: link.mediaId,
          },
        },
        create: link,
        update: { order: link.order },
      });
    }
  }

  for (const entry of (timeline ?? []) as AnyRecord[]) {
    const { media, tags, ...tData } = entry;
    await tx.timelineEntry.upsert({
      where: { id: tData.id },
      create: {
        ...tData,
        yearbookId: data.id,
        eventDate: new Date(tData.eventDate),
        deletedAt: tData.deletedAt ? new Date(tData.deletedAt) : null,
      },
      update: {
        ...tData,
        eventDate: new Date(tData.eventDate),
        deletedAt: tData.deletedAt ? new Date(tData.deletedAt) : null,
      },
    });

    for (const link of (media ?? []) as AnyRecord[]) {
      await tx.timelineEntryMedia.upsert({
        where: {
          timelineEntryId_mediaId: {
            timelineEntryId: tData.id,
            mediaId: link.mediaId,
          },
        },
        create: link,
        update: { order: link.order },
      });
    }
  }

  for (const track of (music ?? []) as AnyRecord[]) {
    await tx.musicEntry.upsert({
      where: { id: track.id },
      create: { ...track, yearbookId: data.id },
      update: track,
    });
  }

  for (const note of (parentNotes ?? []) as AnyRecord[]) {
    await tx.parentNote.upsert({
      where: { id: note.id },
      create: { ...note, yearbookId: data.id },
      update: note,
    });
  }

  if (futureLetter) {
    await tx.futureLetter.upsert({
      where: { id: futureLetter.id },
      create: { ...futureLetter, yearbookId: data.id },
      update: futureLetter,
    });
  }

  for (const attachment of (attachments ?? []) as AnyRecord[]) {
    await tx.attachment.upsert({
      where: { id: attachment.id },
      create: { ...attachment, yearbookId: data.id },
      update: attachment,
    });
  }

  for (const asset of (mediaAssets ?? []) as AnyRecord[]) {
    await restoreMediaAsset(tx, asset, childId);
  }
}
