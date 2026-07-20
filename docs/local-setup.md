# Memoria — local mode (no MinIO)

Minimal stack for running at home: PostgreSQL + Redis + the app with on-disk storage.

```bash
cp .env.example .env
docker compose -f docker-compose.local.yml up -d
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Demo credentials: `demo@memoria.app` / `demo1234`

## Storage

Photos and videos are stored in `./storage/` (override with `STORAGE_PATH`).
S3/MinIO is not used in this mode.

## Export for long-term archive

1. Open a year → **Export** → choose **Full ZIP**
2. The ZIP contains:
   - `html/index.html` — open in a browser (offline)
   - `html/assets/images/` — photos referenced by filename
   - `html/assets/videos/` — videos playable with `<video>`
   - `pdf/yearbook.pdf` — printable version (no embedded videos)
   - `data/yearbook.json` — open data format
   - `manifest.json` — checksums for integrity

3. Copy the ZIP to USB. Open `html/index.html` to view everything offline.

## Local security

After creating your account, set in `.env`:

```
ALLOW_REGISTRATION=false
```

This blocks public registration; only existing users can sign in.

## Access from iPhone (dev)

1. Mac and phone on the **same Wi‑Fi**
2. Find your Mac's LAN IP: `ipconfig getifaddr en0`
3. In `.env`: `AUTH_URL="http://192.168.x.x:3000"` (your IP)
4. Restart `npm run dev`
5. On iPhone Safari: `http://192.168.x.x:3000`

If that still fails, see **[remote-access.md](./remote-access.md)**.

## MacBook production

For real use on an always-on M1 Mac, see **[production-mac.md](./production-mac.md)**.
