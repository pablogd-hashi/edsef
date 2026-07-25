import { prisma } from "@/lib/db/prisma";
import { calculateAge } from "@/lib/age";
import type { CreateMilestoneInput } from "@/lib/validators";
import type { Milestone } from "@prisma/client";

export class MilestoneService {
  async listByYearbook(yearbookId: string): Promise<Milestone[]> {
    return prisma.milestone.findMany({
      where: { yearbookId, deletedAt: null },
      orderBy: { order: "asc" },
      include: {
        location: true,
        media: { include: { media: { include: { variants: true } } } },
        tags: { include: { tag: true } },
        people: { include: { person: true } },
      },
    });
  }

  async create(input: CreateMilestoneInput, birthDate: Date): Promise<Milestone> {
    const ageLabel =
      input.ageLabel ??
      (input.eventDate ? calculateAge(birthDate, input.eventDate).label : undefined);

    const count = await prisma.milestone.count({ where: { yearbookId: input.yearbookId } });

    return prisma.milestone.create({
      data: {
        yearbookId: input.yearbookId,
        title: input.title,
        description: input.description,
        eventDate: input.eventDate,
        ageLabel,
        locationId: input.locationId,
        order: count,
      },
    });
  }

  async update(
    id: string,
    data: Omit<Partial<CreateMilestoneInput>, "locationId"> & { locationId?: string | null },
    birthDate?: Date
  ): Promise<Milestone> {
    const updateData: Record<string, unknown> = { ...data };
    if (data.eventDate && birthDate && !data.ageLabel) {
      updateData.ageLabel = calculateAge(birthDate, data.eventDate).label;
    }
    return prisma.milestone.update({ where: { id }, data: updateData });
  }

  async softDelete(id: string): Promise<void> {
    await prisma.milestone.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const milestoneService = new MilestoneService();
