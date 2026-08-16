---
name: setup-icloud-inbox
description: Create and share the iCloud Drive Memoria Inbox folder for iPhone capture. Use when the user wants the real phone drop-box, not a local test folder.
disable-model-invocation: true
---

# Set up the iCloud inbox

Full notes: `docs/icloud-inbox.md`.

1. Finder → iCloud Drive → new folder `Memoria Inbox`.
2. Inside it, one subfolder per child, named exactly like their **nickname** in Memoria.
3. Share `Memoria Inbox` with only the other parent.
4. In `.env`:

```
ICLOUD_INBOX_PATH="/Users/YOU/Library/Mobile Documents/com~apple~CloudDocs/Memoria Inbox"
```

5. Restart `/start-inbox-watch` (or load the LaunchAgent via `/install-autostart`).

iPhone: Photos → Share → Save to Files → that child folder. The Mac can be asleep; import happens when it wakes and the watcher is running. Skip files that still show a cloud icon (`.icloud` placeholders).
