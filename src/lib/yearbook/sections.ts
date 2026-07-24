import type { SectionType } from "@prisma/client";

export const YEARBOOK_SECTIONS = [
  {
    id: "cover",
    label: "Cover",
    subtitle: "",
    emptyHint: "",
    sectionType: "COVER" as SectionType,
  },
  {
    id: "summary",
    label: "Summary",
    subtitle: "A snapshot of the year",
    emptyHint: "Add where you lived, context, and opening notes.",
    sectionType: "SUMMARY" as SectionType,
  },
  {
    id: "milestones",
    label: "Highlights",
    subtitle: "What you achieved this year",
    emptyHint: "Add milestones — first steps, trips, favourite foods…",
    sectionType: "MILESTONES" as SectionType,
  },
  {
    id: "music",
    label: "Music",
    subtitle: "Songs you loved",
    emptyHint: "Add the soundtrack of this year.",
    sectionType: "MUSIC" as SectionType,
  },
  {
    id: "stories",
    label: "Stories",
    subtitle: "The big narratives",
    emptyHint: "Write the birth story, a trip, or a memory worth keeping.",
    sectionType: "STORIES" as SectionType,
  },
  {
    id: "videos",
    label: "Videos",
    subtitle: "Moving memories",
    emptyHint: "Paste links to videos (Google Drive, YouTube…).",
    sectionType: "VIDEOS" as SectionType,
  },
  {
    id: "notes",
    label: "Notes from Mommy & Daddy",
    subtitle: "Little observations along the way",
    emptyHint: "Short notes from mom or dad — sleep, habits, funny moments.",
    sectionType: "PARENT_NOTES" as SectionType,
  },
  {
    id: "before-birth",
    label: "Before you were born",
    subtitle: "What mom & dad were up to",
    emptyHint: "Month by month, before baby arrived.",
    sectionType: "TIMELINE" as SectionType,
  },
  {
    id: "this-year",
    label: "This year",
    subtitle: "Month by month — family life",
    emptyHint: "Add photos and moments to the calendar.",
    sectionType: "TIMELINE" as SectionType,
  },
] as const;

export type YearbookSectionId = (typeof YEARBOOK_SECTIONS)[number]["id"];

export function getSectionByType(type: SectionType) {
  return YEARBOOK_SECTIONS.find((s) => s.sectionType === type);
}

export function getSectionById(id: string) {
  return YEARBOOK_SECTIONS.find((s) => s.id === id);
}

export interface SectionEditorState {
  id: string;
  sectionId: string;
  label: string;
  order: number;
  visible: boolean;
}

export function buildSectionEditorState(
  dbSections: { id: string; type: string; title: string | null; order: number; visible: boolean }[]
): SectionEditorState[] {
  return [...dbSections]
    .sort((a, b) => a.order - b.order)
    .map((db) => {
      const ui = YEARBOOK_SECTIONS.find((s) => s.sectionType === db.type);
      return {
        id: db.id,
        sectionId: ui?.id ?? db.type.toLowerCase(),
        label: db.title ?? ui?.label ?? db.type,
        order: db.order,
        visible: db.visible,
      };
    });
}
