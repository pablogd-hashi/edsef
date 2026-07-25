"use client";

import { googleMapsUrl } from "@/lib/maps/parse-url";

export function MapEmbed({
  latitude,
  longitude,
  name,
  childId,
  className,
}: {
  latitude: number;
  longitude: number;
  name?: string;
  childId: string;
  className?: string;
}) {
  const mapImage = `/api/maps/static?childId=${encodeURIComponent(childId)}&lat=${latitude}&lng=${longitude}`;
  const osmLink = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=14/${latitude}/${longitude}`;
  const googleLink = googleMapsUrl(latitude, longitude, name);

  return (
    <div className={className}>
      {name && (
        <p className="text-sm text-muted mb-2 flex items-center gap-1.5">
          <span className="text-accent-dark">📍</span>
          {name}
        </p>
      )}
      <a
        href={googleLink}
        target="_blank"
        rel="noopener noreferrer"
        className="block group"
        title="Open in Google Maps"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mapImage}
          alt={name ? `Map of ${name}` : "Location map"}
          className="w-full h-48 rounded-xl border border-border-light object-cover group-hover:border-accent/40 transition-colors bg-cream/40"
          loading="lazy"
        />
      </a>
      <div className="flex flex-wrap gap-3 mt-2">
        <a
          href={googleLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent-dark hover:underline font-medium"
        >
          Open in Google Maps →
        </a>
        <a
          href={osmLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted hover:text-accent-dark hover:underline"
        >
          OpenStreetMap
        </a>
      </div>
    </div>
  );
}
