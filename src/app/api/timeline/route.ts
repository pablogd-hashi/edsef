import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { timelineService } from "@/lib/services/timeline.service";
import { createTimelineEntrySchema } from "@/lib/validators";
import { requireParentSession } from "@/lib/api/require-parent";
import { z } from "zod";

const createBodySchema = createTimelineEntrySchema.extend({
  childId: z.string().cuid(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { childId, yearbookId, title, description, eventDate, month, locationId } =
    parsed.data;

  const auth = await requireParentSession(childId);
  if (auth.error) return auth.error;

  const yearbook = await prisma.yearbook.findFirst({
    where: { id: yearbookId, childId, deletedAt: null },
    include: { child: { select: { birthDate: true } } },
  });

  if (!yearbook) {
    return NextResponse.json({ error: "Yearbook not found" }, { status: 404 });
  }

  const entry = await timelineService.create(
    { yearbookId, title, description, eventDate, month, locationId },
    yearbook.child.birthDate
  );

  return NextResponse.json(entry, { status: 201 });
}
