import { NextResponse } from "next/server";
import { milestoneService } from "@/lib/services/milestone.service";
import { updateMilestoneSchema } from "@/lib/validators";
import { getChildIdFromMilestone, requireParentSession } from "@/lib/api/require-parent";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const milestone = await getChildIdFromMilestone(id);
  if (!milestone) {
    return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  }

  const auth = await requireParentSession(milestone.yearbook.childId);
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = updateMilestoneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await milestoneService.update(
    id,
    parsed.data,
    milestone.yearbook.child.birthDate
  );

  return NextResponse.json(updated);
}
