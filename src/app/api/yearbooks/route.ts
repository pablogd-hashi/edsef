import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { yearbookService } from "@/lib/services";
import { createYearbookSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.familyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");

  if (!childId) {
    return NextResponse.json({ error: "childId required" }, { status: 400 });
  }

  const yearbooks = await yearbookService.listByChild(childId);
  return NextResponse.json(yearbooks);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createYearbookSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const yearbook = await yearbookService.create(parsed.data, session.user.id);
  return NextResponse.json(yearbook, { status: 201 });
}
