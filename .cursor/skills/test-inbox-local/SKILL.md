---
name: test-inbox-local
description: Dry-run the inbox watcher with a local folder instead of iCloud. Use when the user wants to test photo import without sharing iCloud Drive.
disable-model-invocation: true
---

# Test inbox with a local folder

1. In `.env`, set a local path (must match a child **nickname** subfolder):

```
ICLOUD_INBOX_PATH="/tmp/memoria-inbox"
```

2. Create the child folder and drop a photo. Replace `Sofia` with the nickname in Memoria:

```bash
mkdir -p /tmp/memoria-inbox/Sofia
# copy a jpg, heic, or mov into that folder
```

3. App must be running (`/start-dev` or `/start-prod`). Then:

```bash
npm run inbox:watch
```

Wait ~30s. Pass: terminal shows `[inbox] imported ...`, dashboard shows **new from iCloud**, file moved to `/tmp/memoria-inbox/.imported/Sofia/`. Drop the same file again — log should say duplicate.
