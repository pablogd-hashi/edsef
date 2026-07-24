import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { musicService } from "@/lib/services/music.service";
import { updateMusicSchema } from "@/lib/validators";
import { requireParentSession } from "@/lib/api/require-parent";

async function getChildIdFromMusic(musicId: string) {
  return prisma.musicEntry.findUnique({
    where: { id: musicId },
    include: { yearbook: { select: { childId: true } } },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const track = await getChildIdFromMusic(id);
  if (!track) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const auth = await requireParentSession(track.yearbook.childId);
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = updateMusicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await musicService.update(id, parsed.data);
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const track = await getChildIdFromMusic(id);
  if (!track) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const auth = await requireParentSession(track.yearbook.childId);
  if (auth.error) return auth.error;

  await musicService.delete(id);
  return NextResponse.json({ success: true });
}
