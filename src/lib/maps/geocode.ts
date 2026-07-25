export interface GeocodedPlace {
  name: string;
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: { city?: string; town?: string; country?: string };
}

const USER_AGENT = "MemoriaYearbook/1.0 (family yearbook app)";

export async function searchNominatim(query: string, limit = 6): Promise<NominatimResult[]> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}`,
    {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "en",
      },
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) {
    throw new Error(`Nominatim search failed (${res.status})`);
  }

  return res.json() as Promise<NominatimResult[]>;
}

export async function geocodePlace(query: string): Promise<GeocodedPlace | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const results = await searchNominatim(trimmed, 1);
  const place = results[0];
  if (!place) return null;

  return {
    name: place.display_name.split(",")[0],
    latitude: parseFloat(place.lat),
    longitude: parseFloat(place.lon),
    city: place.address?.city ?? place.address?.town,
    country: place.address?.country,
  };
}

/** Split free-text place lists like "Paris · Rome, Italy; Barcelona" */
export function splitPlaceList(text: string): string[] {
  return text
    .split(/[,;·\n]+/)
    .map((part) => part.replace(/<[^>]+>/g, "").trim())
    .filter((part) => part.length > 1);
}
