import { prisma } from "@/lib/db/prisma";
import type { JobStatus } from "@prisma/client";

export class BackupService {
  async createJob(familyId: string, destination?: string) {
    return prisma.backupJob.create({
      data: {
        familyId,
        destination: destination ?? "primary",
        status: "QUEUED",
      },
    });
  }

  async updateStatus(
    jobId: string,
    status: JobStatus,
    data?: {
      progress?: number;
      resultKey?: string;
      resultSize?: bigint;
      manifestKey?: string;
      error?: string;
    }
  ) {
    return prisma.backupJob.update({
      where: { id: jobId },
      data: {
        status,
        ...(data?.progress !== undefined ? { progress: data.progress } : {}),
        ...(data?.resultKey ? { resultKey: data.resultKey } : {}),
        ...(data?.resultSize ? { resultSize: data.resultSize } : {}),
        ...(data?.manifestKey ? { manifestKey: data.manifestKey } : {}),
        ...(data?.error ? { error: data.error } : {}),
        ...(status === "PROCESSING" ? { startedAt: new Date() } : {}),
        ...(status === "COMPLETED" || status === "FAILED"
          ? { completedAt: new Date() }
          : {}),
      },
    });
  }

  async listByFamily(familyId: string) {
    return prisma.backupJob.findMany({
      where: { familyId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  }

  /**
   * Builds manifest with checksums for backup verification.
   * Full implementation in Phase 8.
   */
  async buildManifest(familyId: string) {
    const children = await prisma.child.findMany({
      where: { familyId, deletedAt: null },
      include: {
        mediaAssets: {
          where: { deletedAt: null },
          include: { variants: true },
        },
      },
    });

    const files: { path: string; checksum: string | null; size: string }[] = [];

    for (const child of children) {
      for (const asset of child.mediaAssets) {
        files.push({
          path: asset.storageKey,
          checksum: asset.checksum,
          size: asset.size.toString(),
        });
        for (const variant of asset.variants) {
          files.push({
            path: variant.storageKey,
            checksum: variant.checksum,
            size: variant.size.toString(),
          });
        }
      }
    }

    return {
      schemaVersion: "1.0",
      familyId,
      createdAt: new Date().toISOString(),
      fileCount: files.length,
      files,
    };
  }
}

export const backupService = new BackupService();
