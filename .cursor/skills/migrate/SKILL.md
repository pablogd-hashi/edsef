---
name: migrate
description: Apply Prisma migrations to the local/production database. Use when tables are missing or ping reports db false.
disable-model-invocation: true
---

# Apply database migrations

Postgres must be running.

```bash
npm run db:migrate:deploy
```

Dev alias: `task migrate`. If this fails with P1000/P2021, `DATABASE_URL` does not match Docker Postgres — see `docs/production-mac.md`.
