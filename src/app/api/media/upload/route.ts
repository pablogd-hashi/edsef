import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { localMediaService } from "@/lib/services/local-media.service";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.familyId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const childId = formData.get("childId") as string;
    const yearbookId = (formData.get("yearbookId") as string) || undefined;
    const milestoneId = (formData.get("milestoneId") as string) || undefined;
    const timelineEntryId = (formData.get("timelineEntryId") as string) || undefined;
    const title = (formData.get("title") as string) || undefined;

    if (!file || !childId) {
      return NextResponse.json({ error: "file y childId requeridos" }, { status: 400 });
    }

    const asset = await localMediaService.upload(session.user.id, session.user.familyId, {
      file,
      childId,
      yearbookId,
      milestoneId,
      timelineEntryId,
      title,
    });

    return NextResponse.json({
      id: asset.id,
      type: asset.type,
      title: asset.title,
      url: `/api/media/${asset.id}/file`,
      thumbnailUrl: `/api/media/${asset.id}/file?variant=thumbnail`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al subir";
    const status = message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
