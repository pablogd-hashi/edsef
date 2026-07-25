# Local development

Minimal stack: PostgreSQL + Redis in Docker, app on your machine with files in `./storage/`.

## Quick start (recommended)

Install [Task](https://taskfile.dev/installation/) (`brew install go-task` on Mac), then:

```bash
task setup    # first time only
task dev      # start everything
```

Open http://localhost:3000/register and create your account. No demo data is seeded.

## Commands

| Task | Description |
|------|-------------|
| `task setup` | Create `.env`, start Docker, install deps, run migrations |
| `task up` | Start Postgres + Redis |
| `task down` | Stop Postgres + Redis |
| `task dev` | Start DB and Next.js dev server |
| `task migrate` | Apply pending migrations |
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

<<<<<<< HEAD
=======
Or with [Task](https://taskfile.dev) installed:

```bash
task setup   # first time
task up      # start DB + dev server
task down    # stop DB containers
```

Open http://localhost:3000/register and create your account. No demo data is seeded.

## Troubleshooting

### `Can't reach database server at localhost:5432`

PostgreSQL is not running. Fix:

1. Open **Docker Desktop** and wait until it is fully started
2. Run: `docker compose -f docker-compose.local.yml up -d`
3. Verify: `curl http://localhost:3000/api/ping` should return `"db": true`
4. If first time or after reset: `npm run db:migrate:deploy`

Login and the dashboard need the database — without it you will see a clear error instead of a crash.

### Port 5432 already in use

Another Postgres is using port 5432. Either stop it, or change the port in `docker-compose.local.yml` and `DATABASE_URL` in `.env`.

>>>>>>> 63fd26e (Add database health checks and clearer setup when Postgres is down)
## Storage

Photos and videos go to `./storage/` (override with `STORAGE_PATH` in `.env`).

## Security

After creating your account, set `ALLOW_REGISTRATION=false` in `.env`.

## Phone access while developing

`npm run dev` listens on `0.0.0.0:3000`. Set `AUTH_URL` to your Mac's LAN IP — see [remote-access.md](./remote-access.md).

## Production on Mac

See [production-mac.md](./production-mac.md).
