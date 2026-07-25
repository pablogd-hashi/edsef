import { NextResponse } from "next/server";
import { requireParentSession } from "@/lib/api/require-parent";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");
  const q = searchParams.get("q");

  if (!childId || !q?.trim()) {
    return NextResponse.json({ error: "childId and q required" }, { status: 400 });
  }

  const auth = await requireParentSession(childId);
  if (auth.error) return auth.error;

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6`,
    {
      headers: {
        "User-Agent": "MemoriaYearbook/1.0 (family yearbook app)",
        "Accept-Language": "en",
      },
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Map search failed" }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
