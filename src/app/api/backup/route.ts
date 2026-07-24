import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { backupService } from "@/lib/services/backup.service";
import { runFamilyBackup } from "@/lib/backup/runner";

export async function GET() {
  const session = await auth();
  if (!session?.user?.familyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "OWNER" && session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const jobs = await backupService.listByFamily(session.user.familyId);
  return NextResponse.json({ jobs });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.familyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Only the family owner can create backups" }, { status: 403 });
  }

  try {
    const result = await runFamilyBackup(session.user.familyId);
    return NextResponse.json({
      success: true,
      backupId: result.backupId,
      fileCount: result.fileCount,
      totalSize: result.totalSize.toString(),
      downloadUrl: `/api/backup/download?backupId=${result.backupId}`,
    });
  } catch (e) {
    console.error("Backup error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Backup failed" },
      { status: 500 }
    );
  }
}
