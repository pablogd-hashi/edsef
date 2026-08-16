/**
 * Runtime check of invite + current year + inbox import against PGlite.
 * Run: npx tsx tests/integration/family-capture.ts
 */
import fs from "fs/promises";
import os from "os";
import path from "path";
import sharp from "sharp";
import { setup, teardown } from "../setup-pglite";

async function main() {
  process.env.STORAGE_PATH = await fs.mkdtemp(path.join(os.tmpdir(), "memoria-storage-"));
  const inboxPath = await fs.mkdtemp(path.join(os.tmpdir(), "memoria-inbox-"));
  process.env.ICLOUD_INBOX_PATH = inboxPath;

  await setup();

  const { prisma } = await import("@/lib/db/prisma");
  const { accessService, InviteError } = await import("@/lib/services/access.service");
  const { yearbookService } = await import("@/lib/services/yearbook.service");
  const { scanInbox } = await import("@/lib/inbox/scan");
  const { currentLifeYearNumber } = await import("@/lib/yearbook/period");

  const owner = await prisma.user.create({
    data: {
      name: "Alex",
      email: "alex@family.test",
      passwordHash: "unused",
    },
  });
  const family = await prisma.family.create({
    data: { name: "Test family" },
  });
  await prisma.familyMember.create({
    data: { familyId: family.id, userId: owner.id, role: "OWNER" },
  });

  const invite = await accessService.createParentInvite(family.id, owner.id);
  if (!invite.token || invite.role !== "PARENT") {
    throw new Error("Invite was not created as PARENT");
  }

  const partner = await accessService.acceptInvitation(invite.token, {
    name: "Sam",
    email: "sam@family.test",
    password: "password12",
  });

  const parents = await accessService.listParents(family.id);
  if (parents.length !== 2) {
    throw new Error(`Expected 2 parents, got ${parents.length}`);
  }
  if (parents.some((p) => p.familyId !== family.id)) {
    throw new Error("Partner was not added to the existing family");
  }

  let usedThrew = false;
  try {
    await accessService.acceptInvitation(invite.token, {
      name: "Other",
      email: "other@family.test",
      password: "password12",
    });
  } catch (error) {
    usedThrew = error instanceof InviteError && error.code === "used";
  }
  if (!usedThrew) throw new Error("Reusing an invite should fail");

  const birthDate = new Date(2024, 5, 1);
  const child = await prisma.child.create({
    data: {
      familyId: family.id,
      fullName: "Sofía García",
      nickname: "Sofia",
      birthDate,
      createdById: owner.id,
    },
  });

  const yearNumber = currentLifeYearNumber(birthDate, new Date(2026, 7, 16));
  if (yearNumber !== 3) {
    throw new Error(`Expected life year 3 in Aug 2026, got ${yearNumber}`);
  }

  const yearbook = await yearbookService.getOrCreateCurrent(
    child.id,
    owner.id,
    new Date(2026, 7, 16)
  );
  if (yearbook.yearNumber !== 3 || yearbook.title !== "Year 3") {
    throw new Error(`Unexpected current yearbook: ${yearbook.title} / ${yearbook.yearNumber}`);
  }
  const again = await yearbookService.getOrCreateCurrent(
    child.id,
    owner.id,
    new Date(2026, 7, 16)
  );
  if (again.id !== yearbook.id) {
    throw new Error("getOrCreateCurrent created a duplicate year");
  }

  const childDir = path.join(inboxPath, "Sofia");
  await fs.mkdir(childDir, { recursive: true });
  const jpeg = await sharp({
    create: { width: 32, height: 32, channels: 3, background: { r: 200, g: 160, b: 80 } },
  })
    .jpeg()
    .toBuffer();
  const photoPath = path.join(childDir, "First smile.jpg");
  await fs.writeFile(photoPath, jpeg);
  const past = Date.now() - 10_000;
  await fs.utimes(photoPath, past / 1000, past / 1000);

  const firstScan = await scanInbox(inboxPath);
  const imported = firstScan.find((r) => r.status === "imported");
  if (!imported) {
    throw new Error(`Inbox did not import: ${JSON.stringify(firstScan)}`);
  }

  const entries = await prisma.timelineEntry.findMany({
    where: { yearbookId: yearbook.id, deletedAt: null },
    include: { media: true },
  });
  if (entries.length !== 1) {
    throw new Error(`Expected 1 timeline moment, got ${entries.length}`);
  }
  if (entries[0].title !== "First smile") {
    throw new Error(`Unexpected title ${entries[0].title}`);
  }
  if (entries[0].media.length !== 1) {
    throw new Error("Timeline moment has no media");
  }

  const leftover = await fs.readdir(childDir);
  if (leftover.length !== 0) {
    throw new Error(`Inbox file was not archived: ${leftover.join(",")}`);
  }
  const archived = await fs.readdir(path.join(inboxPath, ".imported", "Sofia"));
  if (!archived.includes("First smile.jpg")) {
    throw new Error("Imported file missing from .imported/");
  }

  await fs.writeFile(photoPath, jpeg);
  await fs.utimes(photoPath, past / 1000, past / 1000);
  const secondScan = await scanInbox(inboxPath);
  if (!secondScan.some((r) => r.status === "duplicate")) {
    throw new Error(`Expected duplicate skip, got ${JSON.stringify(secondScan)}`);
  }

  const logs = await prisma.auditLog.findMany({
    where: { familyId: family.id, action: "inbox.import" },
  });
  if (logs.length !== 1) {
    throw new Error(`Expected 1 inbox.import audit, got ${logs.length}`);
  }

  console.log("family-capture integration OK", {
    familyId: family.id,
    ownerId: owner.id,
    partnerId: partner.id,
    childId: child.id,
    yearbookId: yearbook.id,
    timelineEntryId: entries[0].id,
  });

  await teardown();
}

main().catch(async (error) => {
  console.error(error);
  await teardown().catch(() => undefined);
  process.exit(1);
});
