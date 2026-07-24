export const BACKUP_SCHEMA_VERSION = "1.0";

export interface BackupManifestFile {
  path: string;
  checksum: string | null;
  size: string;
}

export interface BackupManifest {
  schemaVersion: string;
  familyId: string;
  familyName: string;
  createdAt: string;
  fileCount: number;
  files: BackupManifestFile[];
}

export interface BackupDatabaseSnapshot {
  children: unknown[];
  people: unknown[];
  locations: unknown[];
  tags: unknown[];
}

export interface BackupResult {
  backupId: string;
  backupDir: string;
  manifestPath: string;
  databasePath: string;
  storageDir: string;
  fileCount: number;
  totalSize: bigint;
}

export interface RestoreResult {
  restoredFiles: number;
  restoredChildren: number;
  restoredYearbooks: number;
  verifiedChecksums: number;
}
