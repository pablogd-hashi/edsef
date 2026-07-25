import { prisma } from "@/lib/db/prisma";

export class MusicService {
  async create(input: {
    yearbookId: string;
    title: string;
    artist?: string;
    youtubeUrl?: string;
  }) {
    const count = await prisma.musicEntry.count({ where: { yearbookId: input.yearbookId } });
    return prisma.musicEntry.create({
      data: {
        yearbookId: input.yearbookId,
        title: input.title,
        artist: input.artist,
        youtubeUrl: input.youtubeUrl || null,
        order: count,
      },
    });
  }

  async update(id: string, data: { title?: string; artist?: string; youtubeUrl?: string | null }) {
    return prisma.musicEntry.update({ where: { id }, data });
  }

  async delete(id: string) {
    await prisma.musicEntry.delete({ where: { id } });
  }
}

export const musicService = new MusicService();
