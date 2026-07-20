import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { accessService } from "@/lib/services/access.service";
import { yearbookService } from "@/lib/services/yearbook.service";
import { buildYearbookExport } from "@/lib/export/builder";
import { createReadStream, existsSync } from "fs";
import { Readable } from "stream";
import path from "path";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.familyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { yearbookId, childId, format = "ZIP" } = body as {
    yearbookId: string;
    childId: string;
    format?: "ZIP" | "HTML" | "PDF";
  };

  if (!yearbookId || !childId) {
    return NextResponse.json({ error: "yearbookId and childId required" }, { status: 400 });
  }

  const canAccess = await accessService.assertChildAccess(session.user.id, childId);
  if (!canAccess) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const yearbook = await yearbookService.getById(yearbookId, childId);
  if (!yearbook) {
    return NextResponse.json({ error: "Yearbook not found" }, { status: 404 });
  }

  try {
    const result = await buildYearbookExport(
      yearbookId,
      childId,
      session.user.familyId,
      { includePdf: format === "PDF" || format === "ZIP" }
    );

    let downloadPath = result.zipPath;
    let contentType = "application/zip";
    let filename = path.basename(result.zipPath);

    if (format === "HTML") {
      downloadPath = result.htmlPath;
      contentType = "text/html";
      filename = "index.html";
    } else if (format === "PDF" && result.pdfPath) {
      downloadPath = result.pdfPath;
      contentType = "application/pdf";
      filename = "yearbook.pdf";
    }

    if (!existsSync(downloadPath)) {
      return NextResponse.json({ error: "Export not generated" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      downloadUrl: `/api/export/download?path=${encodeURIComponent(downloadPath)}`,
      filename,
      mediaCount: result.mediaRefs.length,
      exportDir: result.exportDir,
    });
  } catch (e) {
    console.error("Export error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Export failed" },
      { status: 500 }
    );
  }
}
