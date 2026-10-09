---
name: install-autostart
description: Install macOS LaunchAgents so Memoria, the inbox watcher and the nightly backup start at login. Use when the user wants the family server to come back after reboot or wants automatic backups.
disable-model-invocation: true
---

# Install login autostart

```bash
./scripts/prod/install-launchagents.sh
```

Installs `com.memoria` (app, auto-restart), `com.memoria.inbox` (only if `ICLOUD_INBOX_PATH` is set) and `com.memoria.backup` (03:30 nightly). Paths come from this checkout; re-run after moving the repo. `--remove` uninstalls.

Also: Docker Desktop → Settings → General → Start Docker Desktop when you sign in.

Logs: `~/Library/Logs/com.memoria*.log`.
