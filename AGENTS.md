<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Memoria skills

One slash command per action. Skills live in `.cursor/skills/<name>/SKILL.md`.

| Command | Action |
|---|---|
| `/setup-dev` | First-time local setup |
| `/start-dev` | Start DB + Next.js |
| `/stop-dev` | Stop local Docker |
| `/doctor` | Diagnose local setup |
| `/run-unit-tests` | Vitest |
| `/run-integration-tests` | Invite + current year + inbox (PGlite) |
| `/run-e2e-tests` | Playwright |
| `/invite-parent` | Second parent one-time link |
| `/lock-registration` | `ALLOW_REGISTRATION=false` |
| `/start-inbox-watch` | Import photos from the inbox folder |
| `/test-inbox-local` | Inbox dry-run without iCloud |
| `/setup-icloud-inbox` | Real iCloud Drive drop-box |
| `/phone-access` | iPhone on home Wi‑Fi |
| `/setup-prod` | Mac production install |
| `/start-prod` | Production server |
| `/stop-prod` | Stop production Docker |
| `/health-check` | Ping + AUTH_URL |
| `/backup` | DB + photos |
| `/restore` | Restore a backup |
| `/update-prod` | After `git pull` |
| `/migrate` | Prisma migrate deploy |
| `/install-autostart` | LaunchAgents at login |
| `/relocate-from-icloud` | Move repo off iCloud Documents |
| `/reset-db` | Wipe local Postgres (destructive) |
