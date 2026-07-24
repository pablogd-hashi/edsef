import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireParentSession } from "@/lib/api/require-parent";

const reorderSchema = z.object({
  milestoneId: z.string().cuid().optional(),
  timelineEntryId: z.string().cuid().optional(),
  mediaIds: z.array(z.string().cuid()).min(1),
});

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = reorderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { milestoneId, timelineEntryId, mediaIds } = parsed.data;

  if (!milestoneId && !timelineEntryId) {
    return NextResponse.json(
      { error: "milestoneId or timelineEntryId required" },
      { status: 400 }
    );
  }

  let childId: string;
  if (milestoneId) {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { yearbook: { select: { childId: true } } },
    });
    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }
    childId = milestone.yearbook.childId;
  } else {
    const entry = await prisma.timelineEntry.findUnique({
      where: { id: timelineEntryId! },
      include: { yearbook: { select: { childId: true } } },
    });
    if (!entry) {
      return NextResponse.json({ error: "Timeline entry not found" }, { status: 404 });
    }
    childId = entry.yearbook.childId;
  }

  const auth = await requireParentSession(childId);
  if (auth.error) return auth.error;

  await prisma.$transaction(
    mediaIds.map((mediaId, order) => {
      if (milestoneId) {
        return prisma.milestoneMedia.update({
          where: { milestoneId_mediaId: { milestoneId, mediaId } },
          data: { order },
        });
      }
      return prisma.timelineEntryMedia.update({
        where: {
          timelineEntryId_mediaId: { timelineEntryId: timelineEntryId!, mediaId },
        },
        data: { order },
      });
    })
  );

  return NextResponse.json({ success: true });
}
