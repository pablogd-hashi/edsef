---
name: stop-dev
description: Stop local Postgres and Redis Docker containers. Use when the user wants to stop the dev database or free ports.
disable-model-invocation: true
---

# Stop local Docker

From the repo root:

```bash
task down
```

This stops Postgres and Redis. Stop the Next.js process separately with Ctrl+C in the terminal that ran `/start-dev`.
