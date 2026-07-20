import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { childrenService } from "@/lib/services";
import { updateChildSchema } from "@/lib/validators";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.familyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const child = await childrenService.getById(id, session.user.familyId);
  if (!child) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(child);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.familyId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isParent =
    session.user.role === "OWNER" || session.user.role === "PARENT";
  if (!isParent) {
    return NextResponse.json({ error: "Only parents can edit" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateChildSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const child = await childrenService.update(
      id,
      session.user.familyId,
      parsed.data,
      session.user.id
    );
    return NextResponse.json(child);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
