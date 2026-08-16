---
name: relocate-from-icloud
description: Move the repo out of iCloud Documents so next/node_modules are not evicted. Use when npm run dev hangs or files show as dataless.
disable-model-invocation: true
---

# Relocate off iCloud Documents

```bash
bash scripts/relocate-from-icloud.sh
```

Then open `~/Developer/edsef-diary/edsef` (or the path the script prints) in Cursor and run `/setup-dev` then `/start-dev`. Details: `docs/local-setup.md`.
