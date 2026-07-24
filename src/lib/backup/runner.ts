import fs from "fs/promises";
import path from "path";
import { createWriteStream } from "fs";
import archiver from "archiver";
import { prisma } from "@/lib/db/prisma";
import { computeSha256 } from "@/lib/storage/checksum";
import { STORAGE_ROOT, ensureDir, fileExists } from "@/lib/storage/local";
import { backupService } from "@/lib/services/backup.service";
import { jsonReplacer, serializeFamilyData } from "./serializer";
import type { BackupManifest, BackupResult } from "./types";
import { BACKUP_SCHEMA_VERSION } from "./types";

export async function runFamilyBackup(familyId: string): Promise<BackupResult> {
  const family = await prisma.family.findUniqueOrThrow({ where: { id: familyId } });
  const job = await backupService.createJob(familyId);

  try {
    await backupService.updateStatus(job.id, "PROCESSING", { progress: 10 });

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = path.join(STORAGE_ROOT, "backups", familyId, `memoria-${stamp}`);
    const storageDir = path.join(backupDir, "storage");
    await ensureDir(storageDir);

    const snapshot = await serializeFamilyData(familyId);
    const databasePath = path.join(backupDir, "database.json");
    await fs.writeFile(
      databasePath,
      JSON.stringify(snapshot, jsonReplacer, 2),
      "utf-8"
    );

    await backupService.updateStatus(job.id, "PROCESSING", { progress: 40 });

    const manifest = await backupService.buildManifest(familyId);
    const manifestWithMeta: BackupManifest = {
      ...manifest,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      familyName: family.name,
    };

    const files: BackupManifest["files"] = [
      {
        path: "database.json",
        checksum: computeSha256(await fs.readFile(databasePath)),
        size: String((await fs.stat(databasePath)).size),
      },
    ];

    let copied = 0;
    for (const file of manifest.files) {
      const src = path.join(STORAGE_ROOT, file.path);
      if (!(await fileExists(src))) continue;

      const dest = path.join(storageDir, file.path);
      await ensureDir(path.dirname(dest));
      await fs.copyFile(src, dest);

      files.push({
        path: `storage/${file.path}`,
        checksum: file.checksum,
        size: file.size,
      });
      copied++;
    }

    manifestWithMeta.files = files;
    manifestWithMeta.fileCount = files.length;

    const manifestPath = path.join(backupDir, "manifest.json");
    await fs.writeFile(
      manifestPath,
      JSON.stringify(manifestWithMeta, null, 2),
      "utf-8"
    );

    const zipPath = `${backupDir}.zip`;
    await createZipArchive(backupDir, zipPath);

    const zipStat = await fs.stat(zipPath);
    const totalSize = BigInt(zipStat.size);

    await backupService.updateStatus(job.id, "COMPLETED", {
      progress: 100,
      resultKey: path.relative(STORAGE_ROOT, zipPath),
      resultSize: totalSize,
      manifestKey: path.relative(STORAGE_ROOT, manifestPath),
    });

    return {
      backupId: job.id,
      backupDir,
      manifestPath,
      databasePath,
      storageDir,
      fileCount: copied + 1,
      totalSize,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backup failed";
    await backupService.updateStatus(job.id, "FAILED", { error: message });
    throw error;
  }
}

async function createZipArchive(sourceDir: string, zipPath: string): Promise<void> {
  await ensureDir(path.dirname(zipPath));

  return new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 6 } });

    output.on("close", () => resolve());
    archive.on("error", reject);

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}
