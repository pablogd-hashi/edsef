import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { accessService } from "@/lib/services/access.service";
import { yearbookService } from "@/lib/services/yearbook.service";
import { buildYearbookExport } from "@/lib/export/builder";
import { existsSync } from "fs";
import path from "path";
import { familyExportsRoot } from "@/lib/storage/local";

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
    let filename = path.basename(result.zipPath);

    if (format === "HTML") {
      downloadPath = result.htmlPath;
      filename = "index.html";
    } else if (format === "PDF" && result.pdfPath) {
      downloadPath = result.pdfPath;
      filename = "yearbook.pdf";
    }

    if (!existsSync(downloadPath)) {
      return NextResponse.json({ error: "Export not generated" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      downloadUrl: `/api/export/download?file=${encodeURIComponent(
        path.relative(familyExportsRoot(session.user.familyId), downloadPath)
      )}`,
      filename,
      mediaCount: result.mediaRefs.length,
    });
  } catch (e) {
    console.error("Export error:", e);
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500 }
    );
  }
}
