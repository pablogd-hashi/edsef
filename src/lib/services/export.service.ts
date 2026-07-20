import { prisma } from "@/lib/db/prisma";
import type { ExportFormat, JobStatus } from "@prisma/client";
import type { ExportOptionsInput } from "@/lib/validators";

export class ExportService {
  async createJob(
    familyId: string,
    options: ExportOptionsInput
  ) {
    return prisma.exportJob.create({
      data: {
        familyId,
        yearbookId: options.yearbookId,
        format: options.format as ExportFormat,
        options: {
          includeOriginals: options.includeOriginals,
          includeVideos: options.includeVideos,
          includeQrCodes: options.includeQrCodes,
        },
        status: "QUEUED",
      },
    });
  }

  async updateStatus(
    jobId: string,
    status: JobStatus,
    data?: { progress?: number; resultKey?: string; resultSize?: bigint; error?: string }
  ) {
    return prisma.exportJob.update({
      where: { id: jobId },
      data: {
        status,
        ...(data?.progress !== undefined ? { progress: data.progress } : {}),
        ...(data?.resultKey ? { resultKey: data.resultKey } : {}),
        ...(data?.resultSize ? { resultSize: data.resultSize } : {}),
        ...(data?.error ? { error: data.error } : {}),
        ...(status === "PROCESSING" ? { startedAt: new Date() } : {}),
        ...(status === "COMPLETED" || status === "FAILED"
          ? { completedAt: new Date() }
          : {}),
      },
    });
  }

  async listByFamily(familyId: string) {
    return prisma.exportJob.findMany({
      where: { familyId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        yearbook: { select: { title: true, child: { select: { fullName: true } } } },
      },
    });
  }

  /**
   * Serializes a yearbook to portable JSON format (schema v1.0).
   * Used by export worker — full implementation in Phase 7.
   */
  async serializeYearbook(yearbookId: string) {
    const yearbook = await prisma.yearbook.findUniqueOrThrow({
      where: { id: yearbookId },
      include: {
        child: true,
        sections: { orderBy: { order: "asc" } },
        stories: { where: { deletedAt: null } },
        milestones: { where: { deletedAt: null }, include: { media: { include: { media: true } } } },
        timeline: { where: { deletedAt: null }, include: { media: { include: { media: true } } } },
        music: true,
        parentNotes: true,
        futureLetter: true,
        mediaAssets: { where: { deletedAt: null }, include: { variants: true } },
      },
    });

    return {
      schemaVersion: "1.0",
      exportedAt: new Date().toISOString(),
      yearbook,
    };
  }
}

export const exportService = new ExportService();
