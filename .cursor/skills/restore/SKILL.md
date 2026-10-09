---
name: restore
description: Restore Memoria from a memoria-* backup folder. Use only when the user explicitly asks to restore a backup.
disable-model-invocation: true
---

# Restore from backup

Destructive. Confirm the backup folder path with the user first, and stop the app.

```bash
npm run prod:restore -- ~/Memoria-Backups/memoria-YYYYMMDD-HHMMSS
```

Verifies checksums, asks the user to type `RESTORE`, replaces the database and photos (old photos kept as `storage.before-restore-…`), then applies migrations. Afterwards run `/health-check` and open the dashboard.
