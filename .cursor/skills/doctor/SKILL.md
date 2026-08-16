---
name: doctor
description: Diagnose local Memoria setup (Node, port 3000, Docker, iCloud dataless files). Use when the app will not start or login fails.
disable-model-invocation: true
---

# Doctor

From the repo root:

```bash
task doctor
```

Reads `scripts/doctor.sh`. Fix anything it reports before `/start-dev`. Common issues: Docker not running, port 3000 in use, repo living in iCloud Documents (dataless `node_modules`).
