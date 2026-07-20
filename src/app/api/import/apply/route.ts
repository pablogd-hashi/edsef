import { NextResponse } from "next/server";
import { applyNotesImport } from "@/lib/services/import.service";
import { importApplySchema } from "@/lib/validators";
import { requireParentSession } from "@/lib/api/require-parent";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = importApplySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { childId, yearbookId, preview } = parsed.data;

  const auth = await requireParentSession(childId);
  if (auth.error) return auth.error;

  try {
    const result = await applyNotesImport(
      yearbookId,
      childId,
      preview,
      auth.session!.user!.id
    );
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
