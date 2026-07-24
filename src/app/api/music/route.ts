import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { musicService } from "@/lib/services/music.service";
import { createMusicBodySchema } from "@/lib/validators";
import { requireParentSession } from "@/lib/api/require-parent";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createMusicBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { childId, yearbookId, title, artist, youtubeUrl } = parsed.data;
  const auth = await requireParentSession(childId);
  if (auth.error) return auth.error;

  const yearbook = await prisma.yearbook.findFirst({
    where: { id: yearbookId, childId, deletedAt: null },
  });
  if (!yearbook) {
    return NextResponse.json({ error: "Yearbook not found" }, { status: 404 });
  }

  const track = await musicService.create({ yearbookId, title, artist, youtubeUrl });
  return NextResponse.json(track, { status: 201 });
}
