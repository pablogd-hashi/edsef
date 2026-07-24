import { NextResponse } from "next/server";
import { z } from "zod";
import { yearbookService } from "@/lib/services";
import { requireParentSession } from "@/lib/api/require-parent";

const updateSectionsSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string().cuid(),
      order: z.number().int().min(0),
      visible: z.boolean().optional(),
      title: z.string().max(100).optional(),
    })
  ),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: yearbookId } = await params;
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");

  if (!childId) {
    return NextResponse.json({ error: "childId required" }, { status: 400 });
  }

  const auth = await requireParentSession(childId);
  if (auth.error) return auth.error;

  const yearbook = await yearbookService.getById(yearbookId, childId);
  if (!yearbook) {
    return NextResponse.json({ error: "Yearbook not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateSectionsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  await yearbookService.updateSectionOrder(yearbookId, parsed.data.sections);
  return NextResponse.json({ success: true });
}
