---
name: start-prod
description: Start Memoria in production on the Mac (Postgres + Next.js on :3000). Use when the user wants the family server running.
disable-model-invocation: true
---

# Start production

From the repo root:

```bash
npm run prod:start
```

Listens on `0.0.0.0:3000`. Keep this terminal open (or use `/install-autostart`). For photos from the phone while the Mac sleeps, also run `/start-inbox-watch` or the inbox LaunchAgent.

iPhone on Wi‑Fi: `/phone-access`.
