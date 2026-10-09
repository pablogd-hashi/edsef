import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { createReadStream, existsSync } from "fs";
import { Readable } from "stream";
import path from "path";
import { familyExportsRoot, isInside } from "@/lib/storage/local";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.familyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file");

  if (!file) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  // Paths are relative to the caller's own family export folder only.
  const exportsRoot = familyExportsRoot(session.user.familyId);
  const resolved = path.resolve(exportsRoot, file);
  if (!isInside(exportsRoot, resolved) || resolved === path.resolve(exportsRoot)) {
    return NextResponse.json({ error: "Path not allowed" }, { status: 403 });
  }

  if (!existsSync(resolved)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const stream = createReadStream(resolved);
  const webStream = Readable.toWeb(stream) as ReadableStream;
  const filename = path.basename(resolved);
  const ext = path.extname(resolved).toLowerCase();

  const types: Record<string, string> = {
    ".zip": "application/zip",
    ".html": "application/octet-stream",
    ".pdf": "application/pdf",
    ".json": "application/json",
  };

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": types[ext] ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
