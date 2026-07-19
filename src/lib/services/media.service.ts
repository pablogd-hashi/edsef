import { prisma } from "@/lib/db/prisma";
import type { MediaAsset, MediaType, ProcessingStatus } from "@prisma/client";

export interface CreateMediaInput {
  childId: string;
  yearbookId?: string;
  type: MediaType;
  originalFilename: string;
  mimeType: string;
  size: bigint;
  storageKey: string;
  width?: number;
  height?: number;
  duration?: number;
  title?: string;
  description?: string;
  capturedAt?: Date;
  externalUrl?: string;
}

export class MediaService {
  async getById(id: string): Promise<MediaAsset | null> {
    return prisma.mediaAsset.findFirst({
      where: { id, deletedAt: null },
      include: { variants: true },
    });
  }

  async listByChild(childId: string, type?: MediaType): Promise<MediaAsset[]> {
    return prisma.mediaAsset.findMany({
      where: {
        childId,
        deletedAt: null,
        ...(type ? { type } : {}),
      },
      orderBy: { uploadedAt: "desc" },
      include: { variants: true },
    });
  }

  async create(input: CreateMediaInput): Promise<MediaAsset> {
    return prisma.mediaAsset.create({
      data: {
        ...input,
        processingStatus: "PENDING",
      },
    });
  }

  async updateProcessingStatus(
    id: string,
    status: ProcessingStatus,
    checksum?: string
  ): Promise<MediaAsset> {
    return prisma.mediaAsset.update({
      where: { id },
      data: {
        processingStatus: status,
        ...(checksum ? { checksum } : {}),
      },
    });
  }

  async addVariant(
    mediaId: string,
    variant: "ORIGINAL" | "WEB" | "THUMBNAIL",
    data: {
      storageKey: string;
      mimeType: string;
      size: bigint;
      width?: number;
      height?: number;
      checksum?: string;
    }
  ) {
    return prisma.mediaVariant.upsert({
      where: { mediaId_variant: { mediaId, variant } },
      create: { mediaId, variant, ...data },
      update: data,
    });
  }

  async getHealthStats(familyId: string) {
    const children = await prisma.child.findMany({
      where: { familyId, deletedAt: null },
      select: { id: true },
    });
    const childIds = children.map((c) => c.id);

    const [total, withoutChecksum, pending] = await Promise.all([
      prisma.mediaAsset.count({
        where: { childId: { in: childIds }, deletedAt: null },
      }),
      prisma.mediaAsset.count({
        where: { childId: { in: childIds }, deletedAt: null, checksum: null },
      }),
      prisma.mediaAsset.count({
        where: {
          childId: { in: childIds },
          deletedAt: null,
          processingStatus: { in: ["PENDING", "PROCESSING"] },
        },
      }),
    ]);

    const sizeResult = await prisma.mediaAsset.aggregate({
      where: { childId: { in: childIds }, deletedAt: null },
      _sum: { size: true },
    });

    const lastBackup = await prisma.backupJob.findFirst({
      where: { familyId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
    });

    const lastExport = await prisma.exportJob.findFirst({
      where: { familyId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
    });

    return {
      totalFiles: total,
      withoutChecksum,
      pendingProcessing: pending,
      totalSize: sizeResult._sum.size ?? BigInt(0),
      lastBackup: lastBackup?.completedAt ?? null,
      lastExport: lastExport?.completedAt ?? null,
      missingFiles: 0,
      status: withoutChecksum === 0 && pending === 0 ? "healthy" : "attention",
    };
  }
}

export const mediaService = new MediaService();
