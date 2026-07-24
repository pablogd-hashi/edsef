import { NextResponse } from "next/server";
import path from "path";
import { createReadStream, existsSync } from "fs";
import { Readable } from "stream";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { STORAGE_ROOT } from "@/lib/storage/local";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.familyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const backupId = searchParams.get("backupId");

  if (!backupId) {
    return NextResponse.json({ error: "backupId required" }, { status: 400 });
  }

  const job = await prisma.backupJob.findFirst({
    where: { id: backupId, familyId: session.user.familyId, status: "COMPLETED" },
  });

  if (!job?.resultKey) {
    return NextResponse.json({ error: "Backup not found" }, { status: 404 });
  }

  const filePath = path.join(STORAGE_ROOT, job.resultKey);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Backup file missing" }, { status: 404 });
  }

  const stream = createReadStream(filePath);
  const webStream = Readable.toWeb(stream) as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${path.basename(filePath)}"`,
    },
  });
}
