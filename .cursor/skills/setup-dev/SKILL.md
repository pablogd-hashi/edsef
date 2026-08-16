---
name: setup-dev
description: First-time local Memoria setup (.env, Docker, deps, migrations). Use when the user asks to set up the project, install, or run task setup.
disable-model-invocation: true
---

# Setup local development

From the repo root:

```bash
task setup
```

If Task is not installed: `brew install go-task`.

Manual equivalent:

```bash
cp .env.example .env
docker compose -f docker-compose.local.yml up -d
npm install
npm run db:migrate:deploy
mkdir -p storage
```

Do not put the repo in iCloud Documents. If it is, run `/relocate-from-icloud` or `bash scripts/relocate-from-icloud.sh`.

Done when: `.env` exists, Postgres is up, and `npm run db:migrate:deploy` succeeds. Next action: `/start-dev`.
