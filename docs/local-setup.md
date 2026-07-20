# Memoria — local mode (no MinIO)

Minimal stack for running at home: PostgreSQL + Redis + the app with on-disk storage.

```bash
cp .env.example .env
docker compose -f docker-compose.local.yml up -d
npm install
npx prisma migrate deploy
npm run dev
```

## First run

1. Open http://localhost:3000/register and create your account
2. Add a child from the dashboard
3. Create their first life year

No demo users or children are seeded.

## Storage

Photos and videos are stored in `./storage/` (override with `STORAGE_PATH`).
S3/MinIO is not used in this mode.

## Export for long-term archive

1. Open a year → **Export** → choose **Full ZIP**
2. The ZIP contains offline HTML, photos, videos, PDF, and JSON data
3. Copy the ZIP to USB. Open `html/index.html` to view everything offline.

## Local security

After creating your account, set in `.env`:

```
ALLOW_REGISTRATION=false
```

## Access from iPhone (dev)

See **[remote-access.md](./remote-access.md)**.

## MacBook production

See **[production-mac.md](./production-mac.md)**.
