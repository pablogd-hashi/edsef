import { prisma } from "@/lib/db/prisma";
import type { BackupDatabaseSnapshot } from "./types";

/**
 * Serializes all family archive data (excluding auth/users) for backup.
 */
export async function serializeFamilyData(
  familyId: string
): Promise<BackupDatabaseSnapshot> {
  const [children, people, locations, tags] = await Promise.all([
    prisma.child.findMany({
      where: { familyId, deletedAt: null },
      include: {
        yearbooks: {
          where: { deletedAt: null },
          include: {
            sections: { orderBy: { order: "asc" } },
            stories: { where: { deletedAt: null }, orderBy: { order: "asc" } },
            milestones: {
              where: { deletedAt: null },
              orderBy: { order: "asc" },
              include: {
                media: { orderBy: { order: "asc" } },
                tags: true,
                people: true,
              },
            },
            timeline: {
              where: { deletedAt: null },
              orderBy: { eventDate: "asc" },
              include: { media: { orderBy: { order: "asc" } }, tags: true },
            },
            music: { orderBy: { order: "asc" } },
            parentNotes: { orderBy: { order: "asc" } },
            futureLetter: true,
            attachments: true,
            mediaAssets: {
              where: { deletedAt: null },
              include: { variants: true },
            },
          },
        },
        mediaAssets: {
          where: { deletedAt: null },
          include: { variants: true },
        },
      },
    }),
    prisma.person.findMany({ where: { familyId } }),
    prisma.location.findMany({ where: { familyId } }),
    prisma.tag.findMany({ where: { familyId } }),
  ]);

  return { children, people, locations, tags };
}

/** Converts BigInt values to strings for JSON serialization. */
export function jsonReplacer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  return value;
}
