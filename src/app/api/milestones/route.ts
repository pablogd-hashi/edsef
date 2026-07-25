import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { milestoneService } from "@/lib/services/milestone.service";
import { createMilestoneBodySchema } from "@/lib/validators";
import { requireParentSession } from "@/lib/api/require-parent";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createMilestoneBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { childId, yearbookId, ...data } = parsed.data;
  const auth = await requireParentSession(childId);
  if (auth.error) return auth.error;

  const yearbook = await prisma.yearbook.findFirst({
    where: { id: yearbookId, childId, deletedAt: null },
    include: { child: { select: { birthDate: true } } },
  });
  if (!yearbook) {
    return NextResponse.json({ error: "Yearbook not found" }, { status: 404 });
  }

  const milestone = await milestoneService.create(
    { yearbookId, ...data },
    yearbook.child.birthDate
  );
  return NextResponse.json(milestone, { status: 201 });
}
