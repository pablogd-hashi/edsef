import type { YearbookWithRelations } from "@/lib/services/yearbook.service";

export interface ManualSummaryContent {
  subtitle?: string;
  location?: string;
  context?: string;
  highlights?: string[];
  trips?: string;
  favoriteMusic?: string;
  likes?: string;
  fears?: string;
}

export interface DerivedHighlight {
  id: string;
  title: string;
  description?: string | null;
}

export interface MapPoint {
  name: string;
  latitude: number;
  longitude: number;
}

export interface DerivedSummaryContent {
  highlights: DerivedHighlight[];
  favoriteMusic: string;
  stories: string[];
  videos: string[];
  musicTracks: { title: string; artist?: string | null }[];
  locations: string[];
  mapPoints: MapPoint[];
  milestoneCount: number;
  timelineCount: number;
}

export function deriveSummaryFromYearbook(
  yearbook: YearbookWithRelations
): DerivedSummaryContent {
  const highlights = yearbook.milestones.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
  }));

  const musicTracks = yearbook.music.map((t) => ({
    title: t.title,
    artist: t.artist,
  }));

  const favoriteMusic = musicTracks
    .map((t) => [t.title, t.artist].filter(Boolean).join(" — "))
    .join(" · ");

  const stories = yearbook.stories.map((s) => s.title);

  const videos = yearbook.timeline
    .filter((t) => t.category === "VIDEO")
    .map((v) => v.title);

  const locationNames = [
    ...yearbook.milestones.map((m) => m.location?.name),
    ...yearbook.timeline.map((t) => t.location?.name),
  ].filter((name): name is string => Boolean(name));

  const locations = [...new Set(locationNames)];

  const mapPoints: MapPoint[] = [];
  const seen = new Set<string>();
  for (const m of yearbook.milestones) {
    const loc = m.location;
    if (loc?.latitude != null && loc?.longitude != null) {
      const key = `${loc.latitude},${loc.longitude}`;
      if (!seen.has(key)) {
        seen.add(key);
        mapPoints.push({
          name: [loc.name, loc.city, loc.country].filter(Boolean).join(", "),
          latitude: loc.latitude,
          longitude: loc.longitude,
        });
      }
    }
  }
  for (const t of yearbook.timeline) {
    const loc = t.location;
    if (loc?.latitude != null && loc?.longitude != null) {
      const key = `${loc.latitude},${loc.longitude}`;
      if (!seen.has(key)) {
        seen.add(key);
        mapPoints.push({
          name: [loc.name, loc.city, loc.country].filter(Boolean).join(", "),
          latitude: loc.latitude,
          longitude: loc.longitude,
        });
      }
    }
  }

  return {
    highlights,
    favoriteMusic,
    stories,
    videos,
    musicTracks,
    locations,
    mapPoints,
    milestoneCount: yearbook.milestones.length,
    timelineCount: yearbook.timeline.filter((t) => t.category !== "VIDEO").length,
  };
}

export function hasDerivedOrManualSummary(
  manual: ManualSummaryContent | null,
  derived: DerivedSummaryContent
): boolean {
  if (manual?.context || manual?.location || manual?.trips || manual?.likes || manual?.fears) {
    return true;
  }
  if (manual?.highlights?.length || manual?.favoriteMusic) {
    return true;
  }
  return (
    derived.highlights.length > 0 ||
    derived.favoriteMusic.length > 0 ||
    derived.stories.length > 0 ||
    derived.videos.length > 0 ||
    derived.locations.length > 0
  );
}
