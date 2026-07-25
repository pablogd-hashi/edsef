import { NextResponse } from "next/server";
import { requireChildAccess } from "@/lib/api/require-child-access";

const USER_AGENT = "MemoriaYearbook/1.0 (family yearbook app)";

function staticMapUrl(lat: string, lng: string) {
  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: "12",
    size: "800x300",
    markers: `${lat},${lng},lightblue1`,
  });
  return `https://staticmap.openstreetmap.de/staticmap.php?${params.toString()}`;
}

function fallbackSvg(lat: string, lng: string) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="300" viewBox="0 0 800 300">
  <rect width="800" height="300" fill="#f3efe6"/>
  <text x="400" y="140" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" fill="#6b5c4f">Map preview unavailable</text>
  <text x="400" y="170" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#9a8b7e">${lat}, ${lng}</text>
  <circle cx="400" cy="210" r="10" fill="#c45c8a"/>
</svg>`;
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300",
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!childId || !lat || !lng) {
    return NextResponse.json({ error: "childId, lat, and lng required" }, { status: 400 });
  }

  const auth = await requireChildAccess(childId);
  if (auth.error) return auth.error;

  try {
    const res = await fetch(staticMapUrl(lat, lng), {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 86400 },
    });

    if (!res.ok) return fallbackSvg(lat, lng);

    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return fallbackSvg(lat, lng);
  }
}
