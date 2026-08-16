---
name: setup-prod
description: First-time Mac production install (secrets, migrate, build). Use when the user wants to run Memoria as the family server on the laptop.
disable-model-invocation: true
---

# Set up production on the Mac

From the repo root:

```bash
chmod +x scripts/prod/*.sh
./scripts/prod/setup-mac.sh
```

Creates `.env` from `.env.production.example` with random secrets, migrates, and builds. Then `/start-prod`. After the first account, `/lock-registration`. Guide: `docs/production-mac.md`.
