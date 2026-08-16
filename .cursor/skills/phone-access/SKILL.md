---
name: phone-access
description: Make Memoria reachable from iPhone Safari on home Wi-Fi by setting AUTH_URL to the Mac LAN IP. Use when the phone cannot log in or photos will not upload.
disable-model-invocation: true
---

# Phone access on home Wi-Fi

Details: `docs/remote-access.md`.

On the Mac:

```bash
ipconfig getifaddr en0
```

Put that IP in `.env` (must match the URL in Safari exactly):

```
AUTH_URL="http://192.168.x.x:3000"
```

Restart the app. On the iPhone (same Wi‑Fi, not guest network), open that URL in Safari. Then Share → Add to Home Screen.

If login works on the Mac but not the phone, `AUTH_URL` is wrong. For cellular / away from home this project uses the iCloud inbox (`/setup-icloud-inbox`), not port forwarding.
