---
name: start-dev
description: Start Postgres, Redis, and the Next.js dev server. Use when the user wants to run Memoria locally or test in the browser.
disable-model-invocation: true
---

# Start the dev app

From the repo root:

```bash
task dev
```

This starts Docker (Postgres + Redis) then `npm run dev`. The terminal stays blocked. Open http://localhost:3000

If Docker is already running:

```bash
task dev:only
```

Login fails if the database is down — run `/doctor`. For iPhone on Wi‑Fi, use `/phone-access` so `AUTH_URL` is the LAN IP, not localhost.
