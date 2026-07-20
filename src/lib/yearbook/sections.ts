export const YEARBOOK_SECTIONS = [
  {
    id: "cover",
    label: "Cover",
    subtitle: "",
    emptyHint: "",
  },
  {
    id: "summary",
    label: "Summary",
    subtitle: "A snapshot of the year",
    emptyHint: "Add where you lived, context, and opening notes.",
  },
  {
    id: "highlights",
    label: "Highlights",
    subtitle: "What you achieved this year",
    emptyHint: "Add milestones — first steps, trips, favourite foods…",
  },
  {
    id: "music",
    label: "Music",
    subtitle: "Songs you loved",
    emptyHint: "Add the soundtrack of this year.",
  },
  {
    id: "stories",
    label: "Stories",
    subtitle: "The big narratives",
    emptyHint: "Write the birth story, a trip, or a memory worth keeping.",
  },
  {
    id: "videos",
    label: "Videos",
    subtitle: "Moving memories",
    emptyHint: "Paste links to videos (Google Drive, YouTube…).",
  },
  {
    id: "notes",
    label: "Notes from Mommy & Daddy",
    subtitle: "Little observations along the way",
    emptyHint: "Short notes from mom or dad — sleep, habits, funny moments.",
  },
  {
    id: "before-birth",
    label: "Before you were born",
    subtitle: "What mom & dad were up to",
    emptyHint: "Month by month, before baby arrived.",
  },
  {
    id: "parents-year",
    label: "What we were up to",
    subtitle: "Our year, while you grew",
    emptyHint: "Jobs, trips, people we met — month by month.",
  },
  {
    id: "timeline",
    label: "Timeline",
    subtitle: "Your year, month by month",
    emptyHint: "Add photos and moments to the calendar.",
  },
] as const;

export type YearbookSectionId = (typeof YEARBOOK_SECTIONS)[number]["id"];
