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
  COVER: "Portada",
  SUMMARY: "Resumen del año",
  MILESTONES: "Hitos",
  STORIES: "Historias",
  VIDEOS: "Videos",
  MUSIC: "Música",
  PARENT_NOTES: "Notas de mamá y papá",
  TIMELINE: "Línea temporal",
  FUTURE_LETTER: "Carta al futuro",
  ATTACHMENTS: "Archivos importantes",
};

export const TEMPLATE_LABELS: Record<string, string> = {
  EDITORIAL: "Editorial",
  TIMELINE: "Timeline",
  ALBUM: "Álbum",
};
