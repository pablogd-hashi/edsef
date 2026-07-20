import { NextResponse } from "next/server";
import { timelineService } from "@/lib/services/timeline.service";
import { updateTimelineEntrySchema } from "@/lib/validators";
import { getChildIdFromTimeline, requireParentSession } from "@/lib/api/require-parent";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entry = await getChildIdFromTimeline(id);
  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const auth = await requireParentSession(entry.yearbook.childId);
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = updateTimelineEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await timelineService.update(
    id,
    parsed.data,
    entry.yearbook.child.birthDate
  );

  return NextResponse.json(updated);
}
