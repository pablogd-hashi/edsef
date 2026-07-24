import { prisma } from "@/lib/db/prisma";
import { calculateAge } from "@/lib/age";
import type { CreateTimelineEntryInput } from "@/lib/validators";
import type { TimelineCategory, TimelineEntry } from "@prisma/client";

export class TimelineService {
  async listByYearbook(yearbookId: string): Promise<TimelineEntry[]> {
    return prisma.timelineEntry.findMany({
      where: { yearbookId, deletedAt: null },
      orderBy: [{ month: "asc" }, { eventDate: "asc" }],
      include: {
        location: true,
        media: { include: { media: { include: { variants: true } } } },
        tags: { include: { tag: true } },
      },
    });
  }

  async create(
    input: CreateTimelineEntryInput,
    birthDate: Date
  ): Promise<TimelineEntry> {
    const age = calculateAge(birthDate, input.eventDate);
    const month = input.month ?? input.eventDate.getMonth() + 1;

    return prisma.timelineEntry.create({
      data: {
        yearbookId: input.yearbookId,
        title: input.title,
        description: input.description,
        eventDate: input.eventDate,
        month,
        ageLabel: age.label,
        locationId: input.locationId,
        category: (input.category as TimelineCategory | undefined) ?? "GENERAL",
      },
    });
  }

  async update(
    id: string,
    data: Partial<CreateTimelineEntryInput>,
    birthDate?: Date
  ): Promise<TimelineEntry> {
    const updateData: Record<string, unknown> = { ...data };
    if (data.eventDate && birthDate) {
      updateData.ageLabel = calculateAge(birthDate, data.eventDate).label;
      if (!data.month) {
        updateData.month = data.eventDate.getMonth() + 1;
      }
    }
    return prisma.timelineEntry.update({ where: { id }, data: updateData });
  }

  async softDelete(id: string): Promise<void> {
    await prisma.timelineEntry.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const timelineService = new TimelineService();
