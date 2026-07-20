import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { createReadStream, existsSync } from "fs";
import { Readable } from "stream";
import path from "path";
import { STORAGE_ROOT } from "@/lib/storage/local";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.familyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get("path");

  if (!filePath) {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }

  const resolved = path.resolve(filePath);
  const exportsRoot = path.resolve(STORAGE_ROOT, "exports");

  // Only allow downloads from exports directory
  if (!resolved.startsWith(exportsRoot)) {
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
    ".html": "text/html",
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
