"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { MapEmbed } from "./map-embed";
import type { MapPoint } from "@/lib/yearbook/derive-summary";
import { splitPlaceList } from "@/lib/maps/geocode";

export function SummaryLocationMaps({
  childId,
  text,
  knownPoints = [],
  splitPlaces = true,
  className,
}: {
  childId?: string;
  text?: string;
  knownPoints?: MapPoint[];
  /** When false, geocode the full text as one place (e.g. "Amsterdam, Netherlands"). */
  splitPlaces?: boolean;
  className?: string;
}) {
  const [geocoded, setGeocoded] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const knownKey = knownPoints.map((p) => `${p.latitude},${p.longitude}`).join("|");

  useEffect(() => {
    if (!childId || !text?.trim()) {
      setGeocoded([]);
      return;
    }

    const places = splitPlaces
      ? splitPlaceList(text).filter(
          (place) => !knownPoints.some((p) => p.name.toLowerCase().includes(place.toLowerCase()))
        )
      : [text.trim()].filter(
          (place) =>
            place.length > 0 &&
            !knownPoints.some((p) => p.name.toLowerCase().includes(place.toLowerCase()))
        );

    if (places.length === 0) {
      setGeocoded([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      const results: MapPoint[] = [];
      for (const place of places.slice(0, 4)) {
        try {
          const res = await fetch(
            `/api/geocode?childId=${childId}&q=${encodeURIComponent(place)}`
          );
          if (!res.ok) continue;
          const data = (await res.json()) as {
            name: string;
            latitude: number;
            longitude: number;
            city?: string;
            country?: string;
          };
          results.push({
            name: [data.name, data.city, data.country].filter(Boolean).join(", ") || place,
            latitude: data.latitude,
            longitude: data.longitude,
          });
        } catch {
          // skip failed geocodes
        }
      }
      if (!cancelled) {
        setGeocoded(results);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [childId, text, knownKey, knownPoints, splitPlaces]);

  const points = [...knownPoints, ...geocoded];
  if (points.length === 0 && !loading) return null;

  return (
    <div className={className}>
      {loading && points.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-muted py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading map…
        </div>
      )}
      <div className="space-y-4 mt-3">
        {points.map((point) => (
          <MapEmbed
            key={`${point.latitude}-${point.longitude}-${point.name}`}
            latitude={point.latitude}
            longitude={point.longitude}
            name={point.name}
            childId={childId!}
          />
        ))}
      </div>
    </div>
  );
}
