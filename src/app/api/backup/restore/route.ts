import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { restoreFamilyBackup } from "@/lib/backup/restore";
import { STORAGE_ROOT } from "@/lib/storage/local";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.familyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Only the family owner can restore backups" }, { status: 403 });
  }

  const body = await request.json();
  const { backupId } = body as { backupId?: string };

  if (!backupId) {
    return NextResponse.json({ error: "backupId required" }, { status: 400 });
  }

  const job = await prisma.backupJob.findFirst({
    where: { id: backupId, familyId: session.user.familyId, status: "COMPLETED" },
  });

  if (!job?.resultKey) {
    return NextResponse.json({ error: "Backup not found" }, { status: 404 });
  }

  const zipPath = path.join(STORAGE_ROOT, job.resultKey);
  const backupDir = zipPath.replace(/\.zip$/, "");

  try {
    await fs.access(backupDir);
  } catch {
    return NextResponse.json(
      { error: "Backup files not found on disk. Re-create the backup first." },
      { status: 404 }
    );
  }

  try {
    const result = await restoreFamilyBackup(session.user.familyId, backupDir);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    console.error("Restore error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Restore failed" },
      { status: 500 }
    );
  }
}
