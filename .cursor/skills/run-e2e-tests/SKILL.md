---
name: run-e2e-tests
description: Run Playwright end-to-end tests. Use when the user asks for e2e, Playwright, or browser tests.
disable-model-invocation: true
---

# Run e2e tests

Postgres and the app must be reachable (start with `/start-dev` first, or let Playwright's `webServer` boot `scripts/test-server.mts`).

```bash
npm run test:e2e
```

Covers landing and register/login. Not a substitute for `/run-integration-tests` (invite + inbox).
