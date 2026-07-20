export const EXPORT_SCHEMA_VERSION = "1.0" as const;

export interface ExportManifest {
  schemaVersion: typeof EXPORT_SCHEMA_VERSION;
  exportedAt: string;
  childName: string;
  yearbookTitle: string;
  files: ExportManifestFile[];
}

export interface ExportManifestFile {
  path: string;
  checksum: string | null;
  size: string;
  mimeType?: string;
}

export const SECTION_LABELS: Record<string, string> = {
  COVER: "Cover",
  SUMMARY: "Year summary",
  MILESTONES: "Milestones",
  STORIES: "Stories",
  VIDEOS: "Videos",
  MUSIC: "Music",
  PARENT_NOTES: "Parent notes",
  TIMELINE: "Timeline",
  FUTURE_LETTER: "Future letter",
  ATTACHMENTS: "Important files",
};

export const TEMPLATE_LABELS: Record<string, string> = {
  EDITORIAL: "Editorial",
  TIMELINE: "Timeline",
  ALBUM: "Album",
};
