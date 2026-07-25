export interface ParsedMapLink {
  latitude?: number;
  longitude?: number;
  query?: string;
  label?: string;
}

/** Extract coordinates or search query from common map URLs */
export function parseMapUrl(input: string): ParsedMapLink | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Plain "lat, lng" paste
  const coordOnly = trimmed.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
  if (coordOnly) {
    return {
      latitude: parseFloat(coordOnly[1]),
      longitude: parseFloat(coordOnly[2]),
    };
  }

  try {
    const url = trimmed.startsWith("http") ? new URL(trimmed) : new URL(`https://${trimmed}`);

    const q = url.searchParams.get("q") ?? url.searchParams.get("query");
    if (q) {
      const coord = q.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
      if (coord) {
        return { latitude: parseFloat(coord[1]), longitude: parseFloat(coord[2]), label: q };
      }
      return { query: q, label: q };
    }

    const ll = url.searchParams.get("ll");
    if (ll) {
      const [lat, lng] = ll.split(",");
      if (lat && lng) {
        return { latitude: parseFloat(lat), longitude: parseFloat(lng) };
      }
    }

    // Google: /@52.37,4.90,17z or /place/Name/@52.37,4.90
    const atMatch = url.pathname.concat(url.hash).match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (atMatch) {
      return {
        latitude: parseFloat(atMatch[1]),
        longitude: parseFloat(atMatch[2]),
      };
    }

    // Google: !3d52.37!4d4.90
    const dMatch = trimmed.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
    if (dMatch) {
      return {
        latitude: parseFloat(dMatch[1]),
        longitude: parseFloat(dMatch[2]),
      };
    }

    // Apple Maps: ?ll=52.37,4.90 or ?q=...
    const appleLl = url.searchParams.get("ll");
    if (appleLl) {
      const [lat, lng] = appleLl.split(",");
      if (lat && lng) {
        return { latitude: parseFloat(lat), longitude: parseFloat(lng) };
      }
    }

    // OpenStreetMap: #map=14/52.37/4.90 or mlat/mlon
    const osmHash = url.hash.match(/map=\d+\/(-?\d+\.?\d*)\/(-?\d+\.?\d*)/);
    if (osmHash) {
      return {
        latitude: parseFloat(osmHash[1]),
        longitude: parseFloat(osmHash[2]),
      };
    }
    const mlat = url.searchParams.get("mlat");
    const mlon = url.searchParams.get("mlon");
    if (mlat && mlon) {
      return {
        latitude: parseFloat(mlat),
        longitude: parseFloat(mlon),
      };
    }
  } catch {
    // not a URL — treat as place name
    return { query: trimmed, label: trimmed };
  }

  return { query: trimmed, label: trimmed };
}

export function googleMapsUrl(latitude: number, longitude: number, label?: string): string {
  const q = label ? encodeURIComponent(label) : `${latitude},${longitude}`;
  return `https://www.google.com/maps/search/?api=1&query=${q}&center=${latitude},${longitude}`;
}
