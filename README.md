# Memoria — Family digital yearbooks

Private web app to create, preserve, and export annual diaries for your children. Built for long-term preservation with open formats and full export.

## Production on MacBook (M1+)

Run on your Mac as a family server (laptop stays on):

```bash
chmod +x scripts/prod/*.sh
./scripts/prod/setup-mac.sh --seed
./scripts/prod/start.sh
```

Full guide: **[docs/production-mac.md](docs/production-mac.md)**

**Phone can't connect?** See [docs/remote-access.md](docs/remote-access.md) (LAN checklist + Tailscale).

## Local development

```bash
cp .env.example .env
docker compose -f docker-compose.local.yml up -d
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Guide: [docs/local-setup.md](docs/local-setup.md)

## Features

- Multiple children with independent life years
- Section-based editor (milestones, stories, timeline, future letter)
- Photos and videos with local disk storage
- Inline editing for parents (OWNER/PARENT)
- PDF, offline HTML, JSON, and ZIP export
- Docker Compose for Postgres + Redis

## Stack

- **Frontend/Backend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Database:** PostgreSQL + Prisma
- **Auth:** Auth.js (next-auth v5)
- **Storage:** local filesystem (`./storage`)
- **Tests:** Vitest + Playwright

### Demo credentials

| Field | Value |
|-------|-------|
| Email | `demo@memoria.app` |
| Password | `demo1234` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (listens on `0.0.0.0` for LAN) |
| `npm run build` | Production build |
| `npm run prod:setup` | Initial Mac production setup |
| `npm run prod:start` | Start production server |
| `npm run prod:backup` | Backup DB + photos |
| `npm run prod:update` | Update after `git pull` |
| `npm run test` | Unit tests |

## Documentation

- [Mac production](docs/production-mac.md)
- [Remote access (LAN + Tailscale)](docs/remote-access.md)
- [Local setup](docs/local-setup.md)
- [Architecture](docs/architecture.md)
- [Data model](docs/data-model.md)

## License

Private — family use only.
