import fs from "fs/promises";
import os from "os";
import path from "path";

/**
 * Backups are made by scripts/prod/backup.sh (nightly LaunchAgent or the
 * Health page button). The app only reads what the script wrote.
 */
export const BACKUP_ROOT = path.resolve(
  process.env.BACKUP_DIR ?? path.join(os.homedir(), "Memoria-Backups")
);

export type BackupSummary = {
  name: string;
  createdAt: string;
  bytes: number;
  fileCount: number;
};

export type BackupStatus = {
  root: string;
  lastBackupAt: string | null;
  externalCopiedAt: string | null;
  externalConfigured: boolean;
  running: boolean;
  backups: BackupSummary[];
};

type Manifest = {
  createdAt: string;
  files: Record<string, { bytes: number; fileCount?: number }>;
};

export async function readBackupStatus(): Promise<BackupStatus> {
  const [status, running, backups] = await Promise.all([
    readJson<{ lastBackupAt?: string; externalCopiedAt?: string | null }>(
      path.join(BACKUP_ROOT, "status.json")
    ),
    exists(path.join(BACKUP_ROOT, ".backup.lock")),
    listBackups(),
  ]);

  return {
    root: BACKUP_ROOT,
    lastBackupAt: status?.lastBackupAt ?? backups[0]?.createdAt ?? null,
    externalCopiedAt: status?.externalCopiedAt ?? null,
    externalConfigured: Boolean(process.env.BACKUP_EXTERNAL_DIR),
    running,
    backups,
  };
}

async function listBackups(): Promise<BackupSummary[]> {
  let names: string[];
  try {
    names = (await fs.readdir(BACKUP_ROOT)).filter((n) => n.startsWith("memoria-2"));
  } catch {
    return [];
  }
  const rows = await Promise.all(
    names.map(async (name) => {
      const manifest = await readJson<Manifest>(path.join(BACKUP_ROOT, name, "manifest.json"));
      if (!manifest) return null;
      const files = Object.values(manifest.files);
      return {
        name,
        createdAt: manifest.createdAt,
        bytes: files.reduce((sum, f) => sum + (f.bytes ?? 0), 0),
        fileCount: manifest.files["storage.tar"]?.fileCount ?? 0,
      };
    })
  );
  return rows
    .filter((r): r is BackupSummary => r !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}

async function exists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}
