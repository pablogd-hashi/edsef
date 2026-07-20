# Local development

Minimal stack: PostgreSQL + Redis in Docker, app on your machine with files in `./storage/`.

```bash
cp .env.example .env
docker compose -f docker-compose.local.yml up -d
npm install
npm run db:migrate:deploy
npm run dev
```

Open http://localhost:3000/register and create your account. No demo data is seeded.

## Storage

Photos and videos go to `./storage/` (override with `STORAGE_PATH` in `.env`).

## Security

After creating your account, set `ALLOW_REGISTRATION=false` in `.env`.

## Phone access while developing

`npm run dev` listens on `0.0.0.0:3000`. Set `AUTH_URL` to your Mac's LAN IP — see [remote-access.md](./remote-access.md).

## Production on Mac

See [production-mac.md](./production-mac.md).
