<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Product is **Memoria**, a single Next.js 16 + Prisma + PostgreSQL app. Standard commands live in `package.json` and `docs/local-setup.md`; the notes below are only the non-obvious cloud gotchas.

- **Docker is NOT available** in this VM, so `docker compose -f docker-compose.local.yml up -d` does not work. PostgreSQL 16 is installed natively instead. Redis/MinIO/the worker are architected but unused by the live request path — you do not need them for any dev/test flow.
- **`npm install`/`npm ci` fail without `--legacy-peer-deps`** (dev dep `pglite-prisma-adapter` wants Prisma 7 while the app pins Prisma 6). The update script installs deps with this flag; use it for any manual installs too.
- **Start PostgreSQL on each boot** (it is not auto-started): `sudo pg_ctlcluster 16 main start`. The role/db already exist (role `memoria` / password `memoria_dev`, database `memoria`) matching `DATABASE_URL` in `.env.example`.
- **Before running the app**: `cp .env.example .env` (if missing) then `npm run db:migrate:deploy` to apply migrations. Run dev with `npm run dev` (binds `0.0.0.0:3000`).
- **Registration gate**: `ALLOW_REGISTRATION` in `.env` must be `true` to create the first account at `/register`; after registering, sign in at `/login` (registration does not auto-login).
- **Tests**: `npm test` (Vitest) and `npm run test:e2e` (Playwright) use in-memory PGlite and need no Postgres/Redis. `npm run lint` currently reports 2 pre-existing errors in committed code (`editable-field.tsx`) — not caused by env setup.
