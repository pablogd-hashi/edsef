import { NextResponse } from "next/server";
import { requireChildAccess } from "@/lib/api/require-child-access";
import { searchNominatim } from "@/lib/maps/geocode";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");
  const q = searchParams.get("q");

  if (!childId || !q?.trim()) {
    return NextResponse.json({ error: "childId and q required" }, { status: 400 });
  }

  const auth = await requireChildAccess(childId);
  if (auth.error) return auth.error;

  try {
    const data = await searchNominatim(q, 6);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Map search failed" }, { status: 502 });
  }
}
