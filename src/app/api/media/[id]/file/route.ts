import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { accessService } from "@/lib/services/access.service";
import { mediaService } from "@/lib/services/media.service";
import { localMediaService } from "@/lib/services/local-media.service";
import { inferMimeType } from "@/lib/storage/local";
import { createReadStream, existsSync, statSync } from "fs";
import { Readable } from "stream";
import path from "path";

/** Only these render inline; anything else (html, svg, pdf…) downloads in a sandbox. */
const INLINE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
  "audio/mpeg",
  "audio/mp4",
  "audio/aac",
  "audio/wav",
]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const variant = (searchParams.get("variant") ?? "web") as
    | "original"
    | "web"
    | "thumbnail";

  const asset = await mediaService.getById(id);
  if (!asset) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const canAccess = await accessService.assertChildAccess(session.user.id, asset.childId);
  if (!canAccess) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const filePath = localMediaService.getReadablePath(asset, variant);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Archivo no encontrado en disco" }, { status: 404 });
  }

  // Variants are re-encoded (e.g. HEIC original → JPEG web), so type follows the file served.
  const mimeType = inferMimeType(filePath, asset.mimeType);
  const inline = INLINE_TYPES.has(mimeType);
  const size = statSync(filePath).size;

  const headers: Record<string, string> = {
    "Content-Type": inline ? mimeType : "application/octet-stream",
    "Cache-Control": "private, max-age=3600",
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self'; media-src 'self'",
  };
  if (!inline) {
    headers["Content-Disposition"] =
      `attachment; filename="${path.basename(filePath).replace(/"/g, "")}"`;
  }

  // iOS Safari will not play video without byte-range support.
  const range = parseRange(request.headers.get("range"), size);
  if (range === "invalid") {
    return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }
  if (range) {
    const stream = createReadStream(filePath, { start: range.start, end: range.end });
    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      status: 206,
      headers: {
        ...headers,
        "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
        "Content-Length": String(range.end - range.start + 1),
      },
    });
  }

  const stream = createReadStream(filePath);
  return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
    headers: { ...headers, "Content-Length": String(size) },
  });
}

function parseRange(
  header: string | null,
  size: number
): { start: number; end: number } | "invalid" | null {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (match[1] === "" && match[2] === "")) return null;

  let start: number;
  let end: number;
  if (match[1] === "") {
    // Suffix range: last N bytes.
    const suffix = Number(match[2]);
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === "" ? size - 1 : Math.min(Number(match[2]), size - 1);
  }
  if (start > end || start >= size) return "invalid";
  return { start, end };
}
