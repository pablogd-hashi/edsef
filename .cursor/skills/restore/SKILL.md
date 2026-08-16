---
name: restore
description: Restore Memoria from a backups/memoria-* folder. Use only when the user explicitly asks to restore a backup.
disable-model-invocation: true
---

# Restore from backup

Destructive. Confirm the backup folder path with the user first.

```bash
npm run prod:restore backups/memoria-YYYYMMDD-HHMMSS
```

Postgres must be running. Restores the database dump and storage archive from that directory. After restore, `/health-check` and open the dashboard.
