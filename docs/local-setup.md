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

## Storage

Photos and videos go to `./storage/` (override with `STORAGE_PATH` in `.env`).

## Security

After creating your account, set `ALLOW_REGISTRATION=false` in `.env`.

## Phone access while developing

`npm run dev` listens on `0.0.0.0:3000`. Set `AUTH_URL` to your Mac's LAN IP — see [remote-access.md](./remote-access.md).

## Production on Mac

See [production-mac.md](./production-mac.md).
