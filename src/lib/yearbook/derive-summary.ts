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

export interface DerivedSummaryContent {
  highlights: string[];
  favoriteMusic: string;
  stories: string[];
  videos: string[];
  musicTracks: { title: string; artist?: string | null }[];
  locations: string[];
  milestoneCount: number;
  timelineCount: number;
}

export function deriveSummaryFromYearbook(
  yearbook: YearbookWithRelations
): DerivedSummaryContent {
  const highlights = yearbook.milestones.map((m) => m.title);

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

  return {
    highlights,
    favoriteMusic,
    stories,
    videos,
    musicTracks,
    locations,
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
