export type TimelineCategory =
  | "PARENTS_BEFORE_BIRTH"
  | "PARENTS_DURING_YEAR"
  | "VIDEO"
  | "GENERAL";

export interface ImportMilestone {
  title: string;
  description?: string;
}

export interface ImportStory {
  title: string;
  content: string;
}

export interface ImportMusic {
  title: string;
  artist?: string;
  url?: string;
}

export interface ImportTimelineItem {
  title: string;
  description?: string;
  month: number;
  year: number;
  category: TimelineCategory;
}

export interface ImportParentNote {
  author: string;
  content: string;
  month: number;
  year: number;
}

export interface ImportVideo {
  title: string;
  url: string;
}

export interface ImportSummary {
  context?: string;
  location?: string;
  subtitle?: string;
  highlights?: string[];
}

export interface ImportPreview {
  detectedTitle?: string;
  yearRange?: { start: number; end: number };
  summary: ImportSummary;
  milestones: ImportMilestone[];
  stories: ImportStory[];
  music: ImportMusic[];
  parentsBeforeBirth: ImportTimelineItem[];
  parentsDuringYear: ImportTimelineItem[];
  parentNotes: ImportParentNote[];
  videos: ImportVideo[];
}

export interface ImportApplyResult {
  summaryUpdated: boolean;
  milestones: number;
  stories: number;
  music: number;
  parentsBeforeBirth: number;
  parentsDuringYear: number;
  parentNotes: number;
  videos: number;
  replaced: boolean;
}
