---
name: backup
description: Back up the Memoria database and all photos/videos. Use when the user wants a backup now or asks where backups are.
disable-model-invocation: true
---

# Backup

From the repo root (Postgres must be running):

```bash
npm run prod:backup
```

Writes `~/Memoria-Backups/memoria-YYYYMMDD-HHMMSS/` (or `BACKUP_DIR`) with `database.dump`, `storage.tar` and `manifest.json` (checksums, row counts). Copies to `BACKUP_EXTERNAL_DIR` when that drive is mounted. Nightly backups run automatically after `/install-autostart`. No secrets are stored in backups.
