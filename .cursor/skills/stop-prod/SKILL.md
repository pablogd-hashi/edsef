---
name: stop-prod
description: Stop production Docker (Postgres + Redis). Use when the user wants to stop the family server database.
disable-model-invocation: true
---

# Stop production Docker

From the repo root:

```bash
npm run prod:stop
```

Stops Postgres/Redis. If `start.sh` is in the foreground, stop Node with Ctrl+C in that terminal. Inbox watcher is a separate process — stop it in its own terminal or `launchctl unload` the inbox agent.
