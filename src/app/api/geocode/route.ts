import { NextResponse } from "next/server";
import { requireChildAccess } from "@/lib/api/require-child-access";
import { geocodePlace } from "@/lib/maps/geocode";

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
    const place = await geocodePlace(q);
    if (!place) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }
    return NextResponse.json(place);
  } catch {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
  }
}
