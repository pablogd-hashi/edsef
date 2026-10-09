import { NextResponse } from "next/server";
import { requireChildAccess } from "@/lib/api/require-child-access";
import { requireParentSession } from "@/lib/api/require-parent";
import { yearbookService } from "@/lib/services";
import { createYearbookSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");

  if (!childId) {
    return NextResponse.json({ error: "childId required" }, { status: 400 });
  }

  const access = await requireChildAccess(childId);
  if (access.error) return access.error;

  const yearbooks = await yearbookService.listByChild(childId);
  return NextResponse.json(yearbooks);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createYearbookSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const access = await requireParentSession(parsed.data.childId);
  if (access.error) return access.error;

  const yearbook = await yearbookService.create(parsed.data, access.session.user.id!);
  return NextResponse.json(yearbook, { status: 201 });
}
