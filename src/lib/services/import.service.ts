import { prisma } from "@/lib/db/prisma";
import { plainTextToTiptap } from "@/lib/tiptap";
import { calculateAge } from "@/lib/age";
import type { Prisma } from "@prisma/client";
import type { ImportApplyResult, ImportPreview } from "@/lib/import/types";

function dateForMonthYear(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 15));
}

async function clearYearbookContent(yearbookId: string, tx: Prisma.TransactionClient) {
  await tx.timelineEntry.updateMany({
    where: { yearbookId },
    data: { deletedAt: new Date() },
  });
  await tx.milestone.updateMany({
    where: { yearbookId },
    data: { deletedAt: new Date() },
  });
  await tx.story.updateMany({
    where: { yearbookId },
    data: { deletedAt: new Date() },
  });
  await tx.musicEntry.deleteMany({ where: { yearbookId } });
  await tx.parentNote.deleteMany({ where: { yearbookId } });
}

export async function applyNotesImport(
  yearbookId: string,
  childId: string,
  preview: ImportPreview,
  userId: string,
  replaceExisting = false
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
    parentsBeforeBirth: 0,
    parentsDuringYear: 0,
    parentNotes: 0,
    videos: 0,
    replaced: replaceExisting,
  };

  const summaryContent: Record<string, unknown> = replaceExisting
    ? {}
    : { ...((yearbook.summaryContent as Record<string, unknown>) ?? {}) };

  if (preview.summary.subtitle) summaryContent.subtitle = preview.summary.subtitle;
  if (preview.summary.context) summaryContent.context = preview.summary.context;
  if (preview.summary.location) summaryContent.location = preview.summary.location;
  if (preview.summary.highlights?.length) {
    summaryContent.highlights = preview.summary.highlights;
  }

  await prisma.$transaction(async (tx) => {
    if (replaceExisting) {
      await clearYearbookContent(yearbookId, tx);
    }

    await tx.yearbook.update({
      where: { id: yearbookId },
      data: {
        summaryContent: summaryContent as Prisma.InputJsonValue,
        updatedById: userId,
        ...(preview.detectedTitle ? { customCoverTitle: preview.detectedTitle } : {}),
        ...(preview.yearRange
          ? {
              periodStart: new Date(Date.UTC(preview.yearRange.start, 0, 1)),
              periodEnd: new Date(Date.UTC(preview.yearRange.end, 11, 31)),
            }
          : {}),
      },
    });
    result.summaryUpdated = true;

    for (const [i, m] of preview.milestones.entries()) {
      await tx.milestone.create({
        data: {
          yearbookId,
          title: m.title,
          description: m.description,
          order: i,
        },
      });
      result.milestones++;
    }

    for (const [i, s] of preview.stories.entries()) {
      await tx.story.create({
        data: {
          yearbookId,
          title: s.title,
          content: plainTextToTiptap(s.content) as object,
          order: i,
        },
      });
      result.stories++;
    }

    for (const [i, m] of preview.music.entries()) {
      await tx.musicEntry.create({
        data: {
          yearbookId,
          title: m.title,
          artist: m.artist,
          youtubeUrl:
            m.url?.includes("youtube") || m.url?.includes("youtu.be") ? m.url : undefined,
          order: i,
        },
      });
      result.music++;
    }

    for (const [i, n] of preview.parentNotes.entries()) {
      await tx.parentNote.create({
        data: {
          yearbookId,
          author: n.author,
          content: n.content,
          noteDate: dateForMonthYear(n.year, n.month),
          order: i,
        },
      });
      result.parentNotes++;
    }

    const allTimeline = [
      ...preview.parentsBeforeBirth,
      ...preview.parentsDuringYear,
      ...preview.videos.map((v) => ({
        title: v.title,
        description: v.url,
        month: 1,
        year: preview.yearRange?.start ?? new Date().getFullYear(),
        category: "VIDEO" as const,
      })),
    ];

    for (const item of allTimeline) {
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
          category: item.category,
        },
      });

      if (item.category === "PARENTS_BEFORE_BIRTH") result.parentsBeforeBirth++;
      else if (item.category === "PARENTS_DURING_YEAR") result.parentsDuringYear++;
      else if (item.category === "VIDEO") result.videos++;
    }
  });

  return result;
}
