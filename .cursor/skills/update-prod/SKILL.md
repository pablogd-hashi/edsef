---
name: update-prod
description: Rebuild and restart Memoria after git pull. Use when the user pulled new code and needs production updated.
disable-model-invocation: true
---

# Update production after git pull

From the repo root:

```bash
git pull
npm run prod:update
```

Runs migrate + rebuild. Then `/start-prod` if the app is not already running.
