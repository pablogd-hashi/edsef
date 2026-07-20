import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { accessService } from "@/lib/services/access.service";
import { mediaService } from "@/lib/services/media.service";
import { localMediaService } from "@/lib/services/local-media.service";
import { createReadStream, existsSync } from "fs";
import { Readable } from "stream";

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

  const stream = createReadStream(filePath);
  const webStream = Readable.toWeb(stream) as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": asset.mimeType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
