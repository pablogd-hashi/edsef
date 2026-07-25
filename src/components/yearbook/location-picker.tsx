"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { MapEmbed } from "./map-embed";

export interface LocationData {
  id: string;
  name: string;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: { city?: string; town?: string; country?: string };
}

export function LocationPicker({
  childId,
  location,
  canEdit,
  onSave,
}: {
  childId: string;
  location?: LocationData | null;
  canEdit: boolean;
  onSave: (locationId: string | null) => Promise<void>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = (await res.json()) as NominatimResult[];
      setResults(data);
    } finally {
      setSearching(false);
    }
  }

  async function selectPlace(place: NominatimResult) {
    setSaving(true);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          name: place.display_name.split(",")[0],
          city: place.address?.city ?? place.address?.town,
          country: place.address?.country,
          latitude: parseFloat(place.lat),
          longitude: parseFloat(place.lon),
        }),
      });
      if (!res.ok) throw new Error("Failed to save location");
      const loc = await res.json();
      await onSave(loc.id);
      setOpen(false);
      setQuery("");
      setResults([]);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function clearLocation() {
    await onSave(null);
    router.refresh();
  }

  if (location?.latitude != null && location?.longitude != null) {
    return (
      <div className="mt-4 space-y-2">
        <MapEmbed
          latitude={location.latitude}
          longitude={location.longitude}
          name={[location.name, location.city, location.country].filter(Boolean).join(", ")}
        />
        {canEdit && (
          <button
            type="button"
            onClick={() => void clearLocation()}
            className="text-xs text-muted hover:text-red-600 flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Remove map
          </button>
        )}
      </div>
    );
  }

  if (!canEdit) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(buttonVariants("outline", "sm"), "mt-4 gap-2 border-dashed")}
      >
        <MapPin className="h-4 w-4" /> Add a place on the map
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-accent/30 bg-cream/40 p-4 space-y-3">
      <p className="text-sm font-medium">Search for a place</p>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void search())}
          placeholder="Hospital, city, neighborhood…"
          className="flex-1 rounded-xl border border-border px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => void search()}
          disabled={searching}
          className={cn(buttonVariants("secondary", "sm"))}
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </button>
      </div>
      {results.length > 0 && (
        <ul className="space-y-1 max-h-40 overflow-y-auto">
          {results.map((r) => (
            <li key={`${r.lat}-${r.lon}`}>
              <button
                type="button"
                disabled={saving}
                onClick={() => void selectPlace(r)}
                className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-card transition-colors"
              >
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted">
        Cancel
      </button>
    </div>
  );
}
