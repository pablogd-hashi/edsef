---
name: reset-db
description: Wipe the local Docker Postgres volume and re-run setup. Use only when the user explicitly asks to reset the database.
disable-model-invocation: true
---

# Reset the local database

Destructive. Deletes all local family data in Docker. Confirm with the user first.

```bash
task reset-db
```

Task will prompt. After it finishes, `/start-dev` and register again. Photos in `./storage/` are not deleted by this command — say so if the user also wants those gone.
