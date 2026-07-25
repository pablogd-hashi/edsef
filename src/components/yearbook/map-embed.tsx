"use client";

import { googleMapsUrl } from "@/lib/maps/parse-url";

export function MapEmbed({
  latitude,
  longitude,
  name,
  className,
}: {
  latitude: number;
  longitude: number;
  name?: string;
  className?: string;
}) {
  const delta = 0.015;
  const bbox = `${longitude - delta},${latitude - delta},${longitude + delta},${latitude + delta}`;
  const embedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${latitude},${longitude}`;
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
        <iframe
          title={name ? `Map of ${name}` : "Location map"}
          src={embedSrc}
          className="w-full h-48 rounded-xl border border-border-light pointer-events-none group-hover:border-accent/40 transition-colors"
          loading="lazy"
          referrerPolicy="no-referrer"
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
