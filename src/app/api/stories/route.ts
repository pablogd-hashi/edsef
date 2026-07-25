import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createStoryBodySchema } from "@/lib/validators";
import { plainTextToTiptap } from "@/lib/tiptap";
import { requireParentSession } from "@/lib/api/require-parent";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createStoryBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { childId, yearbookId, title, content } = parsed.data;
  const auth = await requireParentSession(childId);
  if (auth.error) return auth.error;

  const yearbook = await prisma.yearbook.findFirst({
    where: { id: yearbookId, childId, deletedAt: null },
  });
  if (!yearbook) {
    return NextResponse.json({ error: "Yearbook not found" }, { status: 404 });
  }

  const count = await prisma.story.count({ where: { yearbookId, deletedAt: null } });
  const story = await prisma.story.create({
    data: {
      yearbookId,
      title,
      content: plainTextToTiptap(content ?? ""),
      order: count,
    },
  });

  return NextResponse.json(story, { status: 201 });
}
