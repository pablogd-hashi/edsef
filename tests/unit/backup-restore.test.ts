import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs/promises";
import path from "path";
import type { PrismaClient } from "@prisma/client";
import { setup, teardown } from "../setup-pglite";
import { STORAGE_ROOT } from "@/lib/storage/local";
import { computeSha256 } from "@/lib/storage/checksum";

let prisma: PrismaClient;
let familyId: string;
let childId: string;
let yearbookId: string;
let milestoneId: string;
let mediaId: string;
let storageKey: string;

async function seedTestData() {
  const family = await prisma.family.create({
    data: { name: "Backup Test Family" },
  });
  familyId = family.id;

  const child = await prisma.child.create({
    data: {
      familyId,
      fullName: "Test Child",
      birthDate: new Date("2024-01-15"),
    },
  });
  childId = child.id;

  const yearbook = await prisma.yearbook.create({
    data: {
      childId,
      title: "Year 1",
      yearNumber: 1,
      ageLabel: "0-12 months",
    },
  });
  yearbookId = yearbook.id;

  const milestone = await prisma.milestone.create({
    data: {
      yearbookId,
      title: "First smile",
      description: "A wonderful moment",
      order: 0,
    },
  });
  milestoneId = milestone.id;

  const fileContent = Buffer.from("fake-image-data-for-backup-test");

  const asset = await prisma.mediaAsset.create({
    data: {
      childId,
      yearbookId,
      type: "IMAGE",
      originalFilename: "smile.jpg",
      mimeType: "image/jpeg",
      size: BigInt(fileContent.length),
      storageKey: "pending",
      checksum: computeSha256(fileContent),
      processingStatus: "READY",
    },
  });
  mediaId = asset.id;

  storageKey = `media/${familyId}/${childId}/${mediaId}/original.jpg`;
  const finalPath = path.join(STORAGE_ROOT, storageKey);
  await fs.mkdir(path.dirname(finalPath), { recursive: true });
  await fs.writeFile(finalPath, fileContent);

  await prisma.mediaAsset.update({
    where: { id: mediaId },
    data: { storageKey },
  });

  await prisma.milestoneMedia.create({
    data: { milestoneId, mediaId, order: 0 },
  });
}

async function cleanupTestData() {
  if (!familyId) return;

  await prisma.milestoneMedia.deleteMany({ where: { milestoneId } });
  await prisma.mediaAsset.deleteMany({ where: { childId } });
  await prisma.milestone.deleteMany({ where: { yearbookId } });
  await prisma.section.deleteMany({ where: { yearbookId } });
  await prisma.yearbook.deleteMany({ where: { childId } });
  await prisma.child.deleteMany({ where: { familyId } });
  await prisma.backupJob.deleteMany({ where: { familyId } });
  await prisma.family.deleteMany({ where: { id: familyId } });

  if (storageKey) {
    const filePath = path.join(STORAGE_ROOT, storageKey);
    await fs.rm(path.dirname(path.dirname(path.dirname(filePath))), {
      recursive: true,
      force: true,
    });
  }

  const backupRoot = path.join(STORAGE_ROOT, "backups", familyId);
  await fs.rm(backupRoot, { recursive: true, force: true });
}

describe("backup and restore round-trip", () => {
  beforeAll(async () => {
    await setup();
    const { prisma: db } = await import("@/lib/db/prisma");
    prisma = db;
    await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await teardown();
  });

  it("creates a backup with manifest and database snapshot", async () => {
    const { runFamilyBackup } = await import("@/lib/backup/runner");
    const result = await runFamilyBackup(familyId);

    expect(result.fileCount).toBeGreaterThan(0);
    expect(result.backupDir).toBeTruthy();

    const manifest = JSON.parse(
      await fs.readFile(path.join(result.backupDir, "manifest.json"), "utf-8")
    );
    expect(manifest.schemaVersion).toBe("1.0");
    expect(manifest.familyId).toBe(familyId);
    expect(manifest.files.length).toBeGreaterThan(0);

    const database = JSON.parse(
      await fs.readFile(path.join(result.backupDir, "database.json"), "utf-8")
    );
    expect(database.children).toHaveLength(1);
    expect(database.children[0].yearbooks[0].milestones[0].title).toBe("First smile");
  });

  it("restores data after deletion", async () => {
    const { runFamilyBackup } = await import("@/lib/backup/runner");
    const { restoreFamilyBackup } = await import("@/lib/backup/restore");
    const result = await runFamilyBackup(familyId);

    await prisma.milestoneMedia.deleteMany({ where: { milestoneId } });
    await prisma.mediaAsset.deleteMany({ where: { id: mediaId } });
    await prisma.milestone.deleteMany({ where: { id: milestoneId } });
    await fs.rm(path.join(STORAGE_ROOT, storageKey), { force: true });

    const restoreResult = await restoreFamilyBackup(familyId, result.backupDir);
    expect(restoreResult.restoredChildren).toBe(1);
    expect(restoreResult.restoredYearbooks).toBeGreaterThan(0);

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { media: true },
    });
    expect(milestone?.title).toBe("First smile");
    expect(milestone?.media).toHaveLength(1);

    const fileExists = await fs
      .access(path.join(STORAGE_ROOT, storageKey))
      .then(() => true)
      .catch(() => false);
    expect(fileExists).toBe(true);
  });

  it("updates section order and visibility", async () => {
    const section = await prisma.section.create({
      data: {
        yearbookId,
        type: "MILESTONES",
        title: "Highlights",
        order: 2,
        visible: true,
      },
    });

    const { yearbookService } = await import("@/lib/services/yearbook.service");
    await yearbookService.updateSectionOrder(yearbookId, [
      { id: section.id, order: 5, visible: false },
    ]);

    const updated = await prisma.section.findUnique({ where: { id: section.id } });
    expect(updated?.order).toBe(5);
    expect(updated?.visible).toBe(false);

    await prisma.section.delete({ where: { id: section.id } });
  });
});
