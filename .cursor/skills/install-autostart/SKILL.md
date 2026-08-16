---
name: install-autostart
description: Install macOS LaunchAgents so Memoria and the inbox watcher start at login. Use when the user wants the family server to come back after reboot.
disable-model-invocation: true
---

# Install login autostart

Edit the USER paths inside the example plists, then:

```bash
cp deploy/launchd/com.memoria.plist.example ~/Library/LaunchAgents/com.memoria.plist
cp deploy/launchd/com.memoria.inbox.plist.example ~/Library/LaunchAgents/com.memoria.inbox.plist
launchctl load ~/Library/LaunchAgents/com.memoria.plist
launchctl load ~/Library/LaunchAgents/com.memoria.inbox.plist
```

Also: Docker Desktop → Settings → General → Start Docker Desktop when you sign in.

Logs: `~/Library/Logs/memoria.log` and `~/Library/Logs/memoria-inbox.log`. Inbox folder must already exist (`/setup-icloud-inbox`).
