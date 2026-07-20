import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { childrenService } from "@/lib/services";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.familyId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const child = await childrenService.getById(id, session.user.familyId);
  if (!child) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json(child);
}
