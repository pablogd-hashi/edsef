"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { googleMapsUrl } from "@/lib/maps/parse-url";
import { buildMapViewport } from "@/lib/maps/tiles";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 640, height: 192 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setSize({ width: rect.width, height: rect.height });
      }
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const viewport = useMemo(
    () => buildMapViewport(latitude, longitude, size.width, size.height),
    [latitude, longitude, size.width, size.height]
  );

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
        <div
          ref={containerRef}
          className="relative w-full h-48 rounded-xl border border-border-light overflow-hidden bg-[#dde5d0] group-hover:border-accent/40 transition-colors"
        >
          <div
            className="absolute top-0 left-0 grid grid-cols-3"
            style={{
              width: viewport.gridWidth,
              height: viewport.gridHeight,
              transform: `translate(${viewport.offsetX}px, ${viewport.offsetY}px)`,
            }}
          >
            {viewport.tiles.map((tile) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${tile.x}-${tile.y}`}
                src={`/api/maps/tiles/${viewport.zoom}/${tile.x}/${tile.y}?childId=${encodeURIComponent(childId)}`}
                alt=""
                width={256}
                height={256}
                className="block"
                loading="lazy"
                draggable={false}
              />
            ))}
          </div>
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full"
            aria-hidden
          >
            <div className="h-4 w-4 rounded-full border-2 border-white bg-accent shadow-md" />
            <div className="mx-auto h-2 w-0.5 bg-accent" />
          </div>
        </div>
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
      <p className="text-[10px] text-muted-light mt-1">© OpenStreetMap contributors</p>
    </div>
  );
}
