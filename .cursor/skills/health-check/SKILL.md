---
name: health-check
description: Check whether Memoria, Postgres, and AUTH_URL are healthy. Use when the app will not load or the phone cannot connect.
disable-model-invocation: true
---

# Health check

From the repo root:

```bash
npm run prod:health
```

Prints Docker status, `/api/ping`, LAN IP, and `AUTH_URL`. If ping says `"db":false`, run `/migrate`. If `AUTH_URL` is localhost, phones on Wi‑Fi need `/phone-access`.
