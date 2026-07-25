import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { yearbookService } from "@/lib/services";
import { updateYearbookSchema } from "@/lib/validators";
import { requireParentSession } from "@/lib/api/require-parent";

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

  const body = await request.json();
  const parsed = updateYearbookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const yearbook = await yearbookService.update(
      yearbookId,
      childId,
      {
        ...parsed.data,
        summaryContent: parsed.data.summaryContent as Prisma.InputJsonValue | undefined,
      },
      auth.session!.user!.id
    );
    return NextResponse.json(yearbook);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function DELETE(
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

  try {
    await yearbookService.softDelete(yearbookId, childId, auth.session!.user!.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
