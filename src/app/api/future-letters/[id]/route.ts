import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { updateFutureLetterSchema } from "@/lib/validators";
import { getChildIdFromFutureLetter, requireParentSession } from "@/lib/api/require-parent";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const letter = await getChildIdFromFutureLetter(id);
  if (!letter) {
    return NextResponse.json({ error: "Carta no encontrada" }, { status: 404 });
  }

  const auth = await requireParentSession(letter.yearbook.childId);
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = updateFutureLetterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.futureLetter.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}
