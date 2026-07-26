# Local development

Minimal stack: PostgreSQL + Redis in Docker, app on your machine with files in `./storage/`.

## Quick start (recommended)

Install [Task](https://taskfile.dev/installation/) (`brew install go-task` on Mac), then:

```bash
task setup    # first time only
task up       # start DB + dev server
```

Open http://localhost:3000/register and create your account. No demo data is seeded.

## Commands

| Task | Description |
|------|-------------|
| `task setup` | Create `.env`, start Docker, install deps, run migrations |
| `task up` | Start Postgres + Redis and Next.js dev server |
| `task dev` | Same as `task up` |
| `task dev:only` | Start Next.js only (Docker already running) |
| `task doctor` | Check Node, port 3000, Docker, cache size |
| `task db:up` | Start only Postgres + Redis (no dev server) |
| `task down` | Stop Postgres + Redis |
| `task migrate` | Apply pending migrations |
| `task db:status` | Check container and `/api/ping` health |
| `task logs` | Tail Docker logs |
| `task ps` | Show container status |
| `task reset-db` | Wipe DB volume and re-run setup (destructive) |

## Manual setup

```bash
cp .env.example .env
docker compose -f docker-compose.local.yml up -d
npm install
npm run db:migrate:deploy
npm run dev
```

## Troubleshooting

### `task up` stops after `next dev` / `npm run dev` shows nothing

**The terminal blocking is normal** — but you should see `✓ Ready` within 1–2 minutes.

If there is **no output at all** after `next dev`:

```bash
# 1. Diagnose
task doctor

# 2. Clear Next.js cache and retry
rm -rf .next
npm run dev

# 3. Still stuck? Force webpack mode (default in scripts/dev.sh)
DEV_WEBPACK=1 npm run dev

# 4. Kill anything on port 3000
lsof -i :3000
pkill -f "next dev" || true
```

A large `./storage/` folder (photos/videos) can make Turbopack appear frozen on Mac — webpack mode avoids that.

For phone access on your LAN: `DEV_HOST=0.0.0.0 npm run dev`

### `task up` stops after `next dev -H 0.0.0.0` (older message)

**This is normal** — the dev server runs in the foreground and the terminal will not return to a prompt.

1. Wait for `✓ Ready` (first start after `git pull` can take 1–2 minutes)
2. Open http://localhost:3000 — it may work before `Ready` appears
3. Keep that terminal open; use a **second tab** for other commands
4. Stop with **Ctrl+C**

If nothing happens after 2–3 minutes:

```bash
lsof -i :3000          # check port conflict
pkill -f "next dev"    # kill stale processes
task dev:only          # skip Docker if already up
```

### `Can't reach database server at localhost:5432`

PostgreSQL is not running. Fix:

1. Open **Docker Desktop** and wait until it is fully started
2. Run: `docker compose -f docker-compose.local.yml up -d`
3. Verify: `curl http://localhost:3000/api/ping` should return `"db": true`
4. If first time or after reset: `npm run db:migrate:deploy`

Login and the dashboard need the database — without it you will see a clear error instead of a crash.

### Port 5432 already in use

Another Postgres is using port 5432. Either stop it, or change the port in `docker-compose.local.yml` and `DATABASE_URL` in `.env`.

## Storage

Photos and videos go to `./storage/` (override with `STORAGE_PATH` in `.env`).

## Security

After creating your account, set `ALLOW_REGISTRATION=false` in `.env`.

## Phone access while developing

`npm run dev` listens on `0.0.0.0:3000`. Set `AUTH_URL` to your Mac's LAN IP — see [remote-access.md](./remote-access.md).

## Production on Mac

See [production-mac.md](./production-mac.md).
