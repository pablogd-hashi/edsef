---
name: backup
description: Backup the Postgres database and ./storage photos. Use when the user wants a Memoria backup or weekly archive.
disable-model-invocation: true
---

# Backup

From the repo root (Docker Postgres must be running):

```bash
npm run prod:backup
```

Writes `backups/memoria-YYYYMMDD-HHMMSS/` with `database.sql`, `storage.tar.gz`, and a copy of `.env`. Copy that folder off the Mac (Time Machine or an external drive). Do not commit `backups/` or `storage/`.
