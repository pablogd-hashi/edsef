import { NextResponse } from "next/server";
import { requireChildAccess } from "@/lib/api/require-child-access";
import { osmTileUrl } from "@/lib/maps/tiles";

const USER_AGENT = "MemoriaYearbook/1.0 (family yearbook app)";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const { z, x, y } = await params;
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");

  const zoom = Number(z);
  const tileX = Number(x);
  const tileY = Number(y);

  if (!childId || !Number.isInteger(zoom) || !Number.isInteger(tileX) || !Number.isInteger(tileY)) {
    return NextResponse.json({ error: "Invalid tile request" }, { status: 400 });
  }

  if (zoom < 0 || zoom > 18 || tileX < 0 || tileY < 0) {
    return NextResponse.json({ error: "Tile out of range" }, { status: 400 });
  }

  const auth = await requireChildAccess(childId);
  if (auth.error) return auth.error;

  try {
    const res = await fetch(osmTileUrl(zoom, tileX, tileY), {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 604800 },
    });

    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }

    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Tile fetch failed" }, { status: 502 });
  }
}
