import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireParentSession } from "@/lib/api/require-parent";

const reorderSchema = z.object({
  milestoneId: z.string().cuid().optional(),
  timelineEntryId: z.string().cuid().optional(),
  storyId: z.string().cuid().optional(),
  parentNoteId: z.string().cuid().optional(),
  sectionType: z
    .enum([
      "COVER",
      "SUMMARY",
      "MILESTONES",
      "STORIES",
      "VIDEOS",
      "MUSIC",
      "PARENT_NOTES",
      "TIMELINE",
      "FUTURE_LETTER",
      "ATTACHMENTS",
    ])
    .optional(),
  yearbookId: z.string().cuid().optional(),
  mediaIds: z.array(z.string().cuid()).min(1),
});

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = reorderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const {
    milestoneId,
    timelineEntryId,
    storyId,
    parentNoteId,
    sectionType,
    yearbookId,
    mediaIds,
  } = parsed.data;

  const targetCount = [
    milestoneId,
    timelineEntryId,
    storyId,
    parentNoteId,
    sectionType,
  ].filter(Boolean).length;

  if (targetCount !== 1) {
    return NextResponse.json(
      { error: "Exactly one of milestoneId, timelineEntryId, storyId, parentNoteId, or sectionType required" },
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
  } else if (timelineEntryId) {
    const entry = await prisma.timelineEntry.findUnique({
      where: { id: timelineEntryId },
      include: { yearbook: { select: { childId: true } } },
    });
    if (!entry) {
      return NextResponse.json({ error: "Timeline entry not found" }, { status: 404 });
    }
    childId = entry.yearbook.childId;
  } else if (storyId) {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: { yearbook: { select: { childId: true } } },
    });
    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }
    childId = story.yearbook.childId;
  } else if (parentNoteId) {
    const note = await prisma.parentNote.findUnique({
      where: { id: parentNoteId },
      include: { yearbook: { select: { childId: true } } },
    });
    if (!note) {
      return NextResponse.json({ error: "Parent note not found" }, { status: 404 });
    }
    childId = note.yearbook.childId;
  } else {
    if (!yearbookId || !sectionType) {
      return NextResponse.json(
        { error: "yearbookId and sectionType required for section media" },
        { status: 400 }
      );
    }
    const yearbook = await prisma.yearbook.findUnique({
      where: { id: yearbookId },
      select: { childId: true },
    });
    if (!yearbook) {
      return NextResponse.json({ error: "Yearbook not found" }, { status: 404 });
    }
    childId = yearbook.childId;
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
      if (timelineEntryId) {
        return prisma.timelineEntryMedia.update({
          where: {
            timelineEntryId_mediaId: { timelineEntryId, mediaId },
          },
          data: { order },
        });
      }
      if (storyId) {
        return prisma.attachment.updateMany({
          where: { storyId, mediaId },
          data: { order },
        });
      }
      if (parentNoteId) {
        return prisma.attachment.updateMany({
          where: { parentNoteId, mediaId },
          data: { order },
        });
      }
      return prisma.attachment.updateMany({
        where: { yearbookId: yearbookId!, sectionType, mediaId },
        data: { order },
      });
    })
  );

  return NextResponse.json({ success: true });
}
