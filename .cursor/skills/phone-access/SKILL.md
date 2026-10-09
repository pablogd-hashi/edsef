---
name: phone-access
description: Make Memoria reachable from iPhone Safari on home Wi-Fi by setting AUTH_URL to the Mac LAN IP. Use when the phone cannot log in or photos will not upload.
disable-model-invocation: true
---

# Phone access on home Wi-Fi

Details: `docs/remote-access.md`.

## Run the family server (not dev mode)

```bash
task up
```

Production mode — stable on iPhone. **`task dev` flickers on phones** (hot reload).

On the Mac:

```bash
ipconfig getifaddr en0
```

Put that IP in `.env` (must match the URL in Safari exactly), or use Bonjour:

```
AUTH_URL="http://Your-Mac.local:3000"
```

Restart with `task up`. On the iPhone (same Wi‑Fi, not guest network), open that URL in Safari. Then Share → Add to Home Screen.

For always-on use after reboot: `/install-autostart` and `/setup-prod`.

If login works on the Mac but not the phone, `AUTH_URL` is wrong. For cellular / away from home this project uses the iCloud inbox (`/setup-icloud-inbox`), not port forwarding.
