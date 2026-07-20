import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { updateParentNoteSchema } from "@/lib/validators";
import { getChildIdFromParentNote, requireParentSession } from "@/lib/api/require-parent";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const note = await getChildIdFromParentNote(id);
  if (!note) {
    return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 });
  }

  const auth = await requireParentSession(note.yearbook.childId);
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = updateParentNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.parentNote.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}
