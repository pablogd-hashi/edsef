# Memoria in production — MacBook M1/M2/M3

Guide to run Memoria on your Mac as a family server. The laptop should stay on. For phone access, see **[remote-access.md](./remote-access.md)**.

## Requirements

- macOS on Apple Silicon (M1+)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Postgres + Redis only)
- Node.js 22+ (`brew install node@22`)
- Git

## One-time install

```bash
git clone https://github.com/pablogd-hashi/edsef.git
cd edsef
chmod +x scripts/prod/*.sh

# Creates .env with random secrets, migrates DB, builds
./scripts/prod/setup-mac.sh
```

On first visit, create your account at `/register`, then add children from the dashboard. Set `ALLOW_REGISTRATION=false` in `.env` after that.

## Start / stop

```bash
# Production (listens on 0.0.0.0:3000 — reachable on LAN)
./scripts/prod/start.sh

# Stop Docker (Ctrl+C stops the app if running in foreground)
./scripts/prod/stop.sh

# Health check
./scripts/prod/health.sh
```

## Access from iPhone / iPad

**Same Wi‑Fi:** set `AUTH_URL` to your Mac's LAN IP. Full checklist: **[remote-access.md](./remote-access.md#lan-checklist-same-wi-fi)**.

```bash
ipconfig getifaddr en0
# e.g. 192.168.1.42
```

```
AUTH_URL="http://192.168.1.42:3000"
```

Restart the app. On iPhone Safari: `http://192.168.1.42:3000`

**Different network or LAN won't work:** use [Tailscale](./remote-access.md#tailscale-setup-recommended-for-remote--stubborn-lan) — no router port forwarding.

## Security (recommended)

| Step | Action |
|------|--------|
| 1 | Create your parent account |
| 2 | Registration closes automatically after the first account; your partner joins with an invite link |
| 3 | Do not expose port 3000 to the public internet without a VPN |
| 4 | Backups run every night once autostart is installed (below) |

## Auto-start when the Mac boots

```bash
./scripts/prod/install-launchagents.sh
```

This installs three LaunchAgents with the right paths for this checkout:

- `com.memoria` — the app; restarts if it stops (at most once a minute).
- `com.memoria.inbox` — imports photos from the shared iCloud Drive folder, only when `ICLOUD_INBOX_PATH` is set. Setup: [icloud-inbox.md](./icloud-inbox.md).
- `com.memoria.backup` — full backup every night at 03:30 (runs on wake if the Mac was asleep).

Logs are in `~/Library/Logs/com.memoria*.log`. Remove them with `--remove`.

## Backups and restore

- Backups go to `BACKUP_DIR` (default `~/Memoria-Backups`): database dump + all photos + checksums.
- Set `BACKUP_EXTERNAL_DIR` (e.g. `/Volumes/Memoria/Backups`) and every backup is also copied to that drive whenever it is plugged in.
- 14 daily backups plus one per month for a year are kept.
- The Health page shows the last backup and last external copy, and has a "Hacer copia ahora" button.

Restore (stop the app first):

```bash
./scripts/prod/restore.sh ~/Memoria-Backups/memoria-YYYYMMDD-HHMMSS
```

It checks checksums, asks you to type `RESTORE`, replaces the database and photos, and keeps the old photo folder as `storage.before-restore-…` until you delete it.

Ensure Docker Desktop starts at login (Docker Desktop → Settings → General → Start Docker Desktop when you sign in).

## Where data lives

| What | Where |
|------|-------|
| Photos and videos | `./storage/` (or `STORAGE_PATH` in `.env`) |
| Database | Docker volume `memoria_postgres` |
| Backups | `./backups/memoria-YYYYMMDD-HHMMSS/` |

## PDF export

```bash
npx playwright install chromium
```

Then use **Export → PDF** in the app.

## npm commands

| Command | Description |
|---------|-------------|
| `npm run prod:setup` | Alias for setup-mac.sh |
| `npm run prod:start` | Alias for start.sh |
| `npm run prod:update` | Rebuild after git pull |
| `npm run prod:stop` | Alias for stop.sh |
| `npm run prod:backup` | Backup DB + storage |
| `npm run inbox:watch` | Import photos from the iCloud inbox |
| `npm run db:migrate:deploy` | Production migrations |

## Troubleshooting

**Login fails from iPhone**  
`AUTH_URL` in `.env` must match the browser URL exactly (including `http://` and port). See [remote-access.md](./remote-access.md).

**Photos won't load**  
Check that `storage/` exists and is writable.

**Postgres won't start**  
`docker compose -f docker-compose.prod.yml --env-file .env logs postgres`

**Port 3000 in use**  
Set `PORT=3001` in `.env` and update `AUTH_URL`.

**404 on pages like `/children/new` after git pull**  
Production serves a built bundle. Run `npm run prod:update` (or restart with `./scripts/prod/start.sh`, which rebuilds when code changes).

**Database errors (P1000, P2021, tables missing)**  
Ensure `DATABASE_URL` matches `POSTGRES_*` in `.env`, then run `npm run db:migrate:deploy`. First-time setup: `./scripts/prod/setup-mac.sh`.

## Architecture

```
┌─────────────────────────────────────────┐
│  MacBook M1 (always on)                 │
│                                         │
│  ┌─────────────┐    ┌────────────────┐  │
│  │ Docker      │    │ Node.js        │  │
│  │ Postgres    │◄───│ Next.js :3000  │  │
│  │ Redis       │    │ ./storage/     │  │
│  └─────────────┘    └────────────────┘  │
│         ▲                  ▲            │
└─────────┼──────────────────┼────────────┘
          │                  │
     iPhone/iPad         localhost
     LAN or Tailscale    Safari
```

## Development vs production

| | Development | Mac production |
|---|-------------|----------------|
| Command | `npm run dev` | `./scripts/prod/start.sh` |
| Compose | `docker-compose.local.yml` | `docker-compose.prod.yml` |
| Registration | open | `ALLOW_REGISTRATION=false` |
| Build | hot reload | `next build` + `next start` |
