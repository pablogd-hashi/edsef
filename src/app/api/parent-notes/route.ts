import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createParentNoteBodySchema } from "@/lib/validators";
import { requireParentSession } from "@/lib/api/require-parent";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createParentNoteBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { childId, yearbookId, author, content, noteDate } = parsed.data;
  const auth = await requireParentSession(childId);
  if (auth.error) return auth.error;

  const yearbook = await prisma.yearbook.findFirst({
    where: { id: yearbookId, childId, deletedAt: null },
  });
  if (!yearbook) {
    return NextResponse.json({ error: "Yearbook not found" }, { status: 404 });
  }

  const count = await prisma.parentNote.count({ where: { yearbookId } });
  const note = await prisma.parentNote.create({
    data: {
      yearbookId,
      author,
      content,
      noteDate: noteDate ?? new Date(),
      order: count,
    },
  });

  return NextResponse.json(note, { status: 201 });
}
