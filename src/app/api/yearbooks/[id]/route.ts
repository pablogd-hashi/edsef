import { NextResponse } from "next/server";
import { yearbookService } from "@/lib/services";
import { requireParentSession } from "@/lib/api/require-parent";

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
