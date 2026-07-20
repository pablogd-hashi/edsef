import { prisma } from "@/lib/db/prisma";
import { plainTextToTiptap } from "@/lib/tiptap";
import { calculateAge } from "@/lib/age";
import type { Prisma } from "@prisma/client";
import type { ImportApplyResult, ImportPreview } from "@/lib/import/types";

function dateForMonthYear(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 15));
}

function mergeSummary(
  existing: Record<string, unknown> | null,
  incoming: ImportPreview["summary"]
): Record<string, unknown> {
  const base = { ...(existing ?? {}) };
  if (incoming.context && !base.context) base.context = incoming.context;
  if (incoming.location && !base.location) base.location = incoming.location;
  if (incoming.favoriteMusic && !base.favoriteMusic) base.favoriteMusic = incoming.favoriteMusic;
  if (incoming.highlights?.length) {
    const prev = Array.isArray(base.highlights) ? (base.highlights as string[]) : [];
    base.highlights = [...new Set([...prev, ...incoming.highlights])];
  }
  return base;
}

export async function applyNotesImport(
  yearbookId: string,
  childId: string,
  preview: ImportPreview,
  userId: string
): Promise<ImportApplyResult> {
  const yearbook = await prisma.yearbook.findFirst({
    where: { id: yearbookId, childId, deletedAt: null },
    include: { child: { select: { birthDate: true } } },
  });

  if (!yearbook) {
    throw new Error("Yearbook not found");
  }

  const birthDate = yearbook.child.birthDate;
  const result: ImportApplyResult = {
    summaryUpdated: false,
    milestones: 0,
    stories: 0,
    music: 0,
    timeline: 0,
    parentNotes: 0,
  };

  await prisma.$transaction(async (tx) => {
    const existingSummary = yearbook.summaryContent as Record<string, unknown> | null;
    const merged = mergeSummary(existingSummary, preview.summary);
    if (Object.keys(merged).length > 0) {
      await tx.yearbook.update({
        where: { id: yearbookId },
        data: {
          summaryContent: merged as Prisma.InputJsonValue,
          updatedById: userId,
          ...(preview.detectedTitle && !yearbook.customCoverTitle
            ? { customCoverTitle: preview.detectedTitle }
            : {}),
          ...(preview.yearRange && !yearbook.periodStart
            ? {
                periodStart: new Date(Date.UTC(preview.yearRange.start, 0, 1)),
                periodEnd: new Date(Date.UTC(preview.yearRange.end, 11, 31)),
              }
            : {}),
        },
      });
      result.summaryUpdated = true;
    }

    const milestoneCount = await tx.milestone.count({ where: { yearbookId } });
    for (const [i, m] of preview.milestones.entries()) {
      await tx.milestone.create({
        data: {
          yearbookId,
          title: m.title,
          description: m.description,
          order: milestoneCount + i,
        },
      });
      result.milestones++;
    }

    const storyCount = await tx.story.count({ where: { yearbookId } });
    for (const [i, s] of preview.stories.entries()) {
      await tx.story.create({
        data: {
          yearbookId,
          title: s.title,
          content: plainTextToTiptap(s.content) as object,
          order: storyCount + i,
        },
      });
      result.stories++;
    }

    const musicCount = await tx.musicEntry.count({ where: { yearbookId } });
    for (const [i, m] of preview.music.entries()) {
      const youtubeUrl = m.url?.includes("youtube") || m.url?.includes("youtu.be") ? m.url : undefined;
      await tx.musicEntry.create({
        data: {
          yearbookId,
          title: m.title,
          artist: m.artist,
          youtubeUrl,
          order: musicCount + i,
        },
      });
      result.music++;
    }

    const noteCount = await tx.parentNote.count({ where: { yearbookId } });
    for (const [i, n] of preview.parentNotes.entries()) {
      await tx.parentNote.create({
        data: {
          yearbookId,
          author: n.author,
          content: n.content,
          noteDate: dateForMonthYear(n.year, n.month),
          order: noteCount + i,
        },
      });
      result.parentNotes++;
    }

    for (const item of preview.timeline) {
      const eventDate = dateForMonthYear(item.year, item.month);
      const age = calculateAge(birthDate, eventDate);

      await tx.timelineEntry.create({
        data: {
          yearbookId,
          title: item.title,
          description: item.description,
          eventDate,
          month: item.month,
          ageLabel: age.label,
        },
      });
      result.timeline++;
    }
  });

  return result;
}
