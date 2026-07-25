import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { localMediaService } from "@/lib/services/local-media.service";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.familyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        {
          error:
            "Could not read the file. For large videos, restart the server after updating next.config (500MB limit).",
        },
        { status: 413 }
      );
    }
    const file = formData.get("file") as File | null;
    const childId = formData.get("childId") as string;
    const yearbookId = (formData.get("yearbookId") as string) || undefined;
    const milestoneId = (formData.get("milestoneId") as string) || undefined;
    const timelineEntryId = (formData.get("timelineEntryId") as string) || undefined;
    const storyId = (formData.get("storyId") as string) || undefined;
    const parentNoteId = (formData.get("parentNoteId") as string) || undefined;
    const sectionType = (formData.get("sectionType") as string) || undefined;
    const title = (formData.get("title") as string) || undefined;

    if (!file || !childId) {
      return NextResponse.json({ error: "file and childId required" }, { status: 400 });
    }

    const asset = await localMediaService.upload(session.user.id, session.user.familyId, {
      file,
      childId,
      yearbookId,
      milestoneId,
      timelineEntryId,
      storyId,
      parentNoteId,
      sectionType: sectionType as import("@prisma/client").SectionType | undefined,
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
    const message = e instanceof Error ? e.message : "Upload failed";
    const status = message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
