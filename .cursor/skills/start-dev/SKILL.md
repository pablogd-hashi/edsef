---
name: start-dev
description: Start Postgres, Redis, and the Next.js dev server with hot reload. Use only when coding on the Mac — not for iPhone use.
disable-model-invocation: true
---

# Start the dev app (coding only)

For daily use and iPhone, run **`task up`** instead (production mode — no flicker).

From the repo root:

```bash
task dev
```

This starts Docker (Postgres + Redis) then `npm run dev`. The terminal stays blocked. Open http://localhost:3000

If Docker is already running:

```bash
task dev:only
```

Login fails if the database is down — run `/doctor`. For iPhone on Wi‑Fi, use **`task up`** and `/phone-access` so `AUTH_URL` matches Safari.
