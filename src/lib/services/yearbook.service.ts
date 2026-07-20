import { prisma } from "@/lib/db/prisma";
import { calculateAge } from "@/lib/age";
import type { CreateYearbookInput } from "@/lib/validators";
import type { Prisma, SectionType, Yearbook, YearbookTemplate } from "@prisma/client";

const yearbookWithRelations = {
  sections: { orderBy: { order: "asc" as const } },
  stories: { where: { deletedAt: null }, orderBy: { order: "asc" as const } },
  milestones: {
    where: { deletedAt: null },
    orderBy: { order: "asc" as const },
    include: {
      media: { include: { media: true } },
      tags: { include: { tag: true } },
      location: true,
    },
  },
  timeline: {
    where: { deletedAt: null },
    orderBy: { eventDate: "asc" as const },
    include: { media: { include: { media: true } }, location: true },
  },
  music: { orderBy: { order: "asc" as const } },
  parentNotes: { orderBy: { order: "asc" as const } },
  futureLetter: true,
  coverPhoto: { include: { variants: true } },
  child: true,
} satisfies Prisma.YearbookInclude;

export type YearbookWithRelations = Prisma.YearbookGetPayload<{
  include: typeof yearbookWithRelations;
}>;

export type YearbookListItem = Prisma.YearbookGetPayload<{
  include: {
    _count: {
      select: {
        milestones: true;
        stories: true;
        timeline: true;
        mediaAssets: true;
      };
    };
  };
}>;

const DEFAULT_SECTIONS: { type: SectionType; title: string; order: number }[] = [
  { type: "COVER", title: "Cover", order: 0 },
  { type: "SUMMARY", title: "Year summary", order: 1 },
  { type: "MILESTONES", title: "Milestones", order: 2 },
  { type: "STORIES", title: "Stories", order: 3 },
  { type: "VIDEOS", title: "Videos", order: 4 },
  { type: "MUSIC", title: "Music", order: 5 },
  { type: "PARENT_NOTES", title: "Parent notes", order: 6 },
  { type: "TIMELINE", title: "Timeline", order: 7 },
  { type: "FUTURE_LETTER", title: "Future letter", order: 8 },
  { type: "ATTACHMENTS", title: "Important files", order: 9 },
];

export class YearbookService {
  async listByChild(childId: string): Promise<YearbookListItem[]> {
    return prisma.yearbook.findMany({
      where: { childId, deletedAt: null },
      orderBy: { yearNumber: "asc" },
      include: {
        _count: {
          select: {
            milestones: true,
            stories: true,
            timeline: true,
            mediaAssets: true,
          },
        },
      },
    });
  }

  async getById(yearbookId: string, childId?: string): Promise<YearbookWithRelations | null> {
    return prisma.yearbook.findFirst({
      where: {
        id: yearbookId,
        deletedAt: null,
        ...(childId ? { childId } : {}),
      },
      include: yearbookWithRelations,
    });
  }

  async create(input: CreateYearbookInput, userId: string): Promise<Yearbook> {
    const child = await prisma.child.findUniqueOrThrow({
      where: { id: input.childId },
    });

    const age = input.yearNumber
      ? calculateAge(child.birthDate, new Date(child.birthDate.getFullYear() + input.yearNumber, child.birthDate.getMonth(), child.birthDate.getDate()))
      : null;

    return prisma.yearbook.create({
      data: {
        childId: input.childId,
        title: input.title,
        yearNumber: input.yearNumber,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        ageLabel: input.ageLabel ?? (input.yearNumber === 1 ? "0-12 meses" : age?.label),
        template: input.template as YearbookTemplate,
        customCoverTitle: input.customCoverTitle,
        createdById: userId,
        updatedById: userId,
        sections: {
          create: DEFAULT_SECTIONS,
        },
      },
      include: { sections: true },
    });
  }

  async duplicateFromPrevious(
    childId: string,
    sourceYearbookId: string,
    newTitle: string,
    newYearNumber: number,
    userId: string
  ): Promise<Yearbook> {
    const source = await this.getById(sourceYearbookId, childId);
    if (!source) throw new Error("Source yearbook not found");

    return this.create(
      {
        childId,
        title: newTitle,
        yearNumber: newYearNumber,
        template: source.template,
      },
      userId
    );
  }

  async updateSectionOrder(
    yearbookId: string,
    sectionOrders: { id: string; order: number; visible?: boolean }[]
  ): Promise<void> {
    await prisma.$transaction(
      sectionOrders.map(({ id, order, visible }) =>
        prisma.section.update({
          where: { id, yearbookId },
          data: { order, ...(visible !== undefined ? { visible } : {}) },
        })
      )
    );
  }

  async publish(yearbookId: string, userId: string): Promise<Yearbook> {
    return prisma.yearbook.update({
      where: { id: yearbookId },
      data: { status: "PUBLISHED", updatedById: userId },
    });
  }

  async softDelete(yearbookId: string, childId: string, userId: string): Promise<void> {
    const updated = await prisma.yearbook.updateMany({
      where: { id: yearbookId, childId, deletedAt: null },
      data: { deletedAt: new Date(), updatedById: userId },
    });
    if (updated.count === 0) {
      throw new Error("Yearbook not found");
    }
  }
}

export const yearbookService = new YearbookService();
