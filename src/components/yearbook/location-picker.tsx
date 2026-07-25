"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Loader2, X, Link2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { MapEmbed } from "./map-embed";
import { parseMapUrl } from "@/lib/maps/parse-url";

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

type Mode = "search" | "link";

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
  const [mode, setMode] = useState<Mode>("search");
  const [query, setQuery] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    setError("");
    try {
      const res = await fetch(
        `/api/locations/search?childId=${childId}&q=${encodeURIComponent(query)}`
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Search failed (${res.status})`);
      }
      const data = (await res.json()) as NominatimResult[];
      setResults(data);
      if (data.length === 0) setError("No places found — try a different name or paste a map link.");
    } catch (err) {
      setError(
        err instanceof Error && err.message.includes("Unauthorized")
          ? "Please sign in to search for places."
          : "Could not search. Try pasting a Google Maps link instead."
      );
    } finally {
      setSearching(false);
    }
  }

  async function saveLocation(data: {
    name: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  }) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, ...data }),
      });
      if (!res.ok) throw new Error("Failed to save location");
      const loc = await res.json();
      await onSave(loc.id);
      setOpen(false);
      setQuery("");
      setMapUrl("");
      setResults([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function selectPlace(place: NominatimResult) {
    await saveLocation({
      name: place.display_name.split(",")[0],
      city: place.address?.city ?? place.address?.town,
      country: place.address?.country,
      latitude: parseFloat(place.lat),
      longitude: parseFloat(place.lon),
    });
  }

  async function submitMapLink() {
    const parsed = parseMapUrl(mapUrl);
    if (!parsed) {
      setError("Could not read that link. Try a Google Maps or Apple Maps URL.");
      return;
    }

    if (parsed.latitude != null && parsed.longitude != null) {
      await saveLocation({
        name: parsed.label ?? "Pinned location",
        latitude: parsed.latitude,
        longitude: parsed.longitude,
      });
      return;
    }

    if (parsed.query) {
      setQuery(parsed.query);
      setMode("search");
      setSearching(true);
      try {
        const res = await fetch(
          `/api/locations/search?childId=${childId}&q=${encodeURIComponent(parsed.query)}`
        );
        const data = (await res.json()) as NominatimResult[];
        setResults(data);
        if (data.length === 1) {
          await selectPlace(data[0]);
        } else if (data.length === 0) {
          setError("Place not found from that link. Try searching by name.");
        }
      } finally {
        setSearching(false);
      }
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
          childId={childId}
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
      <p className="text-sm text-muted">
        No URL in the text box — search for a place, or paste a <strong>Google Maps</strong> /{" "}
        <strong>Apple Maps</strong> link.
      </p>

      <div className="flex gap-1 rounded-lg bg-card p-1 border border-border-light">
        <button
          type="button"
          onClick={() => setMode("search")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm transition-colors",
            mode === "search" ? "bg-accent text-white" : "text-muted hover:text-foreground"
          )}
        >
          <Search className="h-3.5 w-3.5" /> Search place
        </button>
        <button
          type="button"
          onClick={() => setMode("link")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm transition-colors",
            mode === "link" ? "bg-accent text-white" : "text-muted hover:text-foreground"
          )}
        >
          <Link2 className="h-3.5 w-3.5" /> Paste map link
        </button>
      </div>

      {mode === "search" ? (
        <>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void search())}
              placeholder="BovenIJ Hospital, Amsterdam…"
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
        </>
      ) : (
        <div className="space-y-2">
          <input
            value={mapUrl}
            onChange={(e) => setMapUrl(e.target.value)}
            placeholder="https://maps.google.com/... or https://maps.apple.com/..."
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void submitMapLink()}
            disabled={saving || !mapUrl.trim()}
            className={cn(buttonVariants("secondary", "sm"), "w-full")}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Add from link"}
          </button>
          <p className="text-xs text-muted">
            Tip: open Google Maps → find the place → Share → Copy link → paste here.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted">
        Cancel
      </button>
    </div>
  );
}
