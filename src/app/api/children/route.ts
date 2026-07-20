import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { childrenService } from "@/lib/services";
import { createChildSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session?.user?.familyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const children = await childrenService.listByFamily(session.user.familyId);
  return NextResponse.json(children);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.familyId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createChildSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const child = await childrenService.create(
    session.user.familyId,
    parsed.data,
    session.user.id
  );

  return NextResponse.json(child, { status: 201 });
}
