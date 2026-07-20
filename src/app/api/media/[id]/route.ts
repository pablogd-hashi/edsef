import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { localMediaService } from "@/lib/services/local-media.service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await localMediaService.delete(session.user.id, id);
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al eliminar";
    const status = message === "Forbidden" ? 403 : message === "No encontrado" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
