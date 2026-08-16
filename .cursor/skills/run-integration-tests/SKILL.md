---
name: run-integration-tests
description: Run the PGlite integration test for invite, current year, and inbox import. Use when the user wants to verify the capture path without Docker.
disable-model-invocation: true
---

# Run integration tests

From the repo root:

```bash
npm run test:integration
```

Creates two parents on one family, opens the current life-year, imports a JPEG from a temp inbox, archives it, and skips the duplicate. No Docker. Success prints `family-capture integration OK`.
