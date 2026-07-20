import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { updateStorySchema } from "@/lib/validators";
import { plainTextToTiptap } from "@/lib/tiptap";
import { getChildIdFromStory, requireParentSession } from "@/lib/api/require-parent";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const story = await getChildIdFromStory(id);
  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  const auth = await requireParentSession(story.yearbook.childId);
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = updateStorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: { title?: string; content?: object } = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.content !== undefined) {
    data.content =
      typeof parsed.data.content === "string"
        ? (plainTextToTiptap(parsed.data.content) as object)
        : (parsed.data.content as object);
  }

  const updated = await prisma.story.update({ where: { id }, data });
  return NextResponse.json(updated);
}
