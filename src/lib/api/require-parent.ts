import { auth } from "@/lib/auth/config";
import { accessService } from "@/lib/services/access.service";
import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export async function requireParentSession(childId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const canEdit = await accessService.assertParentAccess(session.user.id, childId);
  if (!canEdit) {
    return { error: NextResponse.json({ error: "Only parents can edit" }, { status: 403 }) };
  }

  return { session, childId };
}

export async function getChildIdFromMilestone(milestoneId: string) {
  const m = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: { yearbook: { select: { childId: true, child: { select: { birthDate: true } } } } },
  });
  return m;
}

export async function getChildIdFromTimeline(timelineId: string) {
  const t = await prisma.timelineEntry.findUnique({
    where: { id: timelineId },
    include: { yearbook: { select: { childId: true, child: { select: { birthDate: true } } } } },
  });
  return t;
}

export async function getChildIdFromStory(storyId: string) {
  return prisma.story.findUnique({
    where: { id: storyId },
    include: { yearbook: { select: { childId: true } } },
  });
}

export async function getChildIdFromParentNote(noteId: string) {
  return prisma.parentNote.findUnique({
    where: { id: noteId },
    include: { yearbook: { select: { childId: true } } },
  });
}

export async function getChildIdFromFutureLetter(letterId: string) {
  return prisma.futureLetter.findUnique({
    where: { id: letterId },
    include: { yearbook: { select: { childId: true } } },
  });
}
