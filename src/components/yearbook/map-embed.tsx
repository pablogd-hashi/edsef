"use client";

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
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <div className={className}>
      {name && (
        <p className="text-sm text-muted mb-2 flex items-center gap-1.5">
          <span className="text-accent-dark">📍</span>
          {name}
        </p>
      )}
      <iframe
        title={name ? `Map of ${name}` : "Location map"}
        src={src}
        className="w-full h-48 rounded-xl border border-border-light"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <a
        href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=14/${latitude}/${longitude}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-accent-dark hover:underline mt-1.5 inline-block"
      >
        Open in OpenStreetMap
      </a>
    </div>
  );
}
