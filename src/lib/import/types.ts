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
}

export interface ImportParentNote {
  author: string;
  content: string;
  month: number;
  year: number;
}

export interface ImportLink {
  label?: string;
  url: string;
}

export interface ImportSummary {
  context?: string;
  location?: string;
  favoriteMusic?: string;
  highlights?: string[];
}

export interface ImportPreview {
  detectedTitle?: string;
  yearRange?: { start: number; end: number };
  summary: ImportSummary;
  milestones: ImportMilestone[];
  stories: ImportStory[];
  music: ImportMusic[];
  timeline: ImportTimelineItem[];
  parentNotes: ImportParentNote[];
  links: ImportLink[];
}

export interface ImportApplyResult {
  summaryUpdated: boolean;
  milestones: number;
  stories: number;
  music: number;
  timeline: number;
  parentNotes: number;
}
