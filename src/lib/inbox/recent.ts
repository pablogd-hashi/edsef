import { prisma } from "@/lib/db/prisma";

export type RecentInboxImport = {
  childId: string;
  yearbookId: string;
  timelineEntryId: string;
  createdAt: Date;
};

export async function listRecentInboxImports(
  familyId: string,
  sinceDays = 7
): Promise<RecentInboxImport[]> {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  const logs = await prisma.auditLog.findMany({
    where: {
      familyId,
      action: "inbox.import",
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
  });

  return logs.flatMap((log) => {
    const meta = log.metadata as {
      childId?: string;
      yearbookId?: string;
      timelineEntryId?: string;
    } | null;
    if (!meta?.childId || !meta.yearbookId || !meta.timelineEntryId) return [];
    return [
      {
        childId: meta.childId,
        yearbookId: meta.yearbookId,
        timelineEntryId: meta.timelineEntryId,
        createdAt: log.createdAt,
      },
    ];
  });
}
