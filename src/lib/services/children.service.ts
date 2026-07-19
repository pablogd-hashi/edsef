import { prisma } from "@/lib/db/prisma";
import type { Child, ChildStatus, Prisma } from "@prisma/client";
import type { CreateChildInput } from "@/lib/validators";

const childListInclude = {
  yearbooks: {
    where: { deletedAt: null },
    orderBy: { yearNumber: "asc" as const },
    select: { id: true, title: true, status: true, yearNumber: true, updatedAt: true },
  },
  _count: { select: { mediaAssets: true } },
} satisfies Prisma.ChildInclude;

export type ChildListItem = Prisma.ChildGetPayload<{
  include: typeof childListInclude;
}>;

export class ChildrenService {
  async listByFamily(familyId: string, includeArchived = false): Promise<ChildListItem[]> {
    return prisma.child.findMany({
      where: {
        familyId,
        deletedAt: null,
        ...(includeArchived ? {} : { status: "ACTIVE" }),
      },
      orderBy: { birthDate: "asc" },
      include: childListInclude,
    });
  }

  async getById(childId: string, familyId: string): Promise<Child | null> {
    return prisma.child.findFirst({
      where: { id: childId, familyId, deletedAt: null },
      include: {
        yearbooks: {
          where: { deletedAt: null },
          orderBy: { yearNumber: "asc" },
        },
        profilePhoto: { include: { variants: true } },
      },
    });
  }

  async create(
    familyId: string,
    input: CreateChildInput,
    userId: string
  ): Promise<Child> {
    return prisma.child.create({
      data: {
        familyId,
        fullName: input.fullName,
        nickname: input.nickname,
        birthDate: input.birthDate,
        themeColor: input.themeColor,
        titleFont: input.titleFont,
        description: input.description,
        createdById: userId,
        updatedById: userId,
      },
    });
  }

  async update(
    childId: string,
    familyId: string,
    data: Prisma.ChildUncheckedUpdateInput,
    userId: string
  ): Promise<Child> {
    await this.assertOwnership(childId, familyId);
    return prisma.child.update({
      where: { id: childId },
      data: { ...data, updatedById: userId },
    });
  }

  async archive(childId: string, familyId: string, userId: string): Promise<Child> {
    return this.update(childId, familyId, { status: "ARCHIVED" as ChildStatus }, userId);
  }

  async softDelete(childId: string, familyId: string): Promise<void> {
    await this.assertOwnership(childId, familyId);
    await prisma.child.update({
      where: { id: childId },
      data: { deletedAt: new Date(), status: "ARCHIVED" },
    });
  }

  private async assertOwnership(childId: string, familyId: string): Promise<void> {
    const child = await prisma.child.findFirst({
      where: { id: childId, familyId, deletedAt: null },
    });
    if (!child) {
      throw new Error("Child not found");
    }
  }
}

export const childrenService = new ChildrenService();
