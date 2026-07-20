# Memoria — Family digital yearbooks

Private web app to create, preserve, and export annual diaries for your children. Built for long-term preservation with open formats and full export.

## First-time setup

1. Deploy or run locally (see below)
2. Open the app → **Create account** at `/register`
3. **Add a child** from the dashboard
4. Create their first life year and start editing

No demo data is included in this repository. Your family's photos and stories live only in your database and `storage/` folder — never commit those to git.

## Production on MacBook (M1+)

```bash
chmod +x scripts/prod/*.sh
./scripts/prod/setup-mac.sh
./scripts/prod/start.sh
```

Full guide: **[docs/production-mac.md](docs/production-mac.md)**

**Phone can't connect?** See [docs/remote-access.md](docs/remote-access.md).

## Local development

```bash
cp .env.example .env
docker compose -f docker-compose.local.yml up -d
npm install
npx prisma migrate deploy
npm run dev
```

Then register at http://localhost:3000/register

Guide: [docs/local-setup.md](docs/local-setup.md)

## Features

- Multiple children with independent life years
- Section-based editor (milestones, stories, timeline, future letter)
- Photos and videos with local disk storage
- Inline editing for parents (OWNER/PARENT)
- PDF, offline HTML, JSON, and ZIP export
- Per-child theme colors (pink/purple palette)
- Docker Compose for Postgres + Redis

## Stack

- **Frontend/Backend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Database:** PostgreSQL + Prisma
- **Auth:** Auth.js (next-auth v5)
- **Storage:** local filesystem (`./storage`)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (listens on `0.0.0.0` for LAN) |
| `npm run build` | Production build |
| `npm run prod:setup` | Initial Mac production setup |
| `npm run prod:start` | Start production server |
| `npm run prod:backup` | Backup DB + photos |
| `npm run test` | Unit tests |

## Publishing this repo

See **[docs/publishing.md](docs/publishing.md)** — what must never be committed.

## Documentation

- [Mac production](docs/production-mac.md)
- [Remote access](docs/remote-access.md)
- [Local setup](docs/local-setup.md)

## License

Private — family use only.
