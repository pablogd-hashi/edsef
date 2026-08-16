---
name: start-inbox-watch
description: Start the inbox watcher that imports photos from ICLOUD_INBOX_PATH into the current life-year. Use when the user wants to import iPhone photos or run inbox:watch.
disable-model-invocation: true
---

# Start inbox watcher

The app (dev or prod) must already be running so Postgres is up. From the repo root, in a **second** terminal:

```bash
npm run inbox:watch
```

Polls every 30s (override with `ICLOUD_INBOX_POLL_MS`). Default folder is iCloud Drive `Memoria Inbox`. Override in `.env`:

```
ICLOUD_INBOX_PATH="/Users/you/Library/Mobile Documents/com~apple~CloudDocs/Memoria Inbox"
```

Leave this process running. Logs `[inbox] imported ...` on success. First-time folder layout: `/setup-icloud-inbox`. Local dry-run: `/test-inbox-local`.
