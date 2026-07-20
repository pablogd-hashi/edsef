# Remote access — phone, iPad, and away from home

## Quick answer: do you need Tailscale?

| Situation | Use |
|-----------|-----|
| iPhone on **same Wi‑Fi** as the Mac | LAN IP in `AUTH_URL` (no Tailscale yet) |
| Login works on Mac but **not on phone** | Fix `AUTH_URL` + Mac firewall (below) |
| Phone on **cellular** or different Wi‑Fi | **Yes — install Tailscale** |
| Router has **client isolation** / guest network | **Yes — Tailscale** |

Try the LAN checklist first. If the phone still cannot reach the app on the same network, Tailscale is the right next step — you do **not** need to open port 3000 on your router.

---

## LAN checklist (same Wi‑Fi)

### 1. Use the LAN IP, not `localhost`

On the Mac:

```bash
ipconfig getifaddr en0
# e.g. 192.168.1.42
```

In `.env`:

```
AUTH_URL="http://192.168.1.42:3000"
```

Restart the app (`Ctrl+C` then `./scripts/prod/start.sh` or `npm run dev`).

On the iPhone, open **exactly** that URL in Safari: `http://192.168.1.42:3000`

> `AUTH_URL` must match the browser URL character-for-character (scheme, host, port).

### 2. Dev vs production

| Mode | Command | Listens on |
|------|---------|------------|
| Dev | `npm run dev` | `0.0.0.0:3000` |
| Prod | `./scripts/prod/start.sh` | `0.0.0.0:3000` |

Both bind to all interfaces. If you run `next start` manually, set `HOSTNAME=0.0.0.0`.

### 3. Mac firewall

**System Settings → Network → Firewall**

- If firewall is on, allow incoming connections for **Node** (or temporarily disable to test).
- After confirming it works, re-enable and add the Node allow rule.

### 4. Same network

- iPhone must not be on a **guest** Wi‑Fi while the Mac is on the main network.
- Some routers enable **AP/client isolation** — devices cannot see each other. Tailscale bypasses this.

### 5. Verify from the Mac

```bash
./scripts/prod/health.sh
curl -s http://$(ipconfig getifaddr en0):3000/api/ping
```

Both should succeed before testing the phone.

---

## Tailscale setup (recommended for remote + stubborn LAN)

[Tailscale](https://tailscale.com) creates a private mesh VPN. Free for personal use. No port forwarding.

### 1. Install

- **Mac:** [tailscale.com/download/mac](https://tailscale.com/download/mac) or `brew install tailscale`
- **iPhone:** Tailscale app from the App Store

Sign in with the **same account** on both devices.

### 2. Find the Mac's Tailscale IP

On the Mac:

```bash
tailscale ip -4
# e.g. 100.64.0.3
```

Or open the Tailscale menu → your Mac → copy the `100.x.x.x` address.

### 3. Update `.env`

```
AUTH_URL="http://100.64.0.3:3000"
```

Replace with your Mac's Tailscale IP. Restart Memoria.

### 4. Open on iPhone

In Safari (on Wi‑Fi **or** cellular):

```
http://100.64.0.3:3000
```

Works anywhere both devices have Tailscale connected.

### 5. Optional: MagicDNS name

In [Tailscale admin](https://login.tailscale.com/admin/dns) enable MagicDNS. Your Mac may get a name like `macbook.tailXXXX.ts.net`:

```
AUTH_URL="http://macbook.tailXXXX.ts.net:3000"
```

### Security notes

- Only devices on **your** Tailscale tailnet can reach the app.
- Keep `ALLOW_REGISTRATION=false` after creating parent accounts.
- Tailscale does not replace backups — run `./scripts/prod/backup.sh` regularly.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Page loads but login fails | `AUTH_URL` mismatch — must equal browser URL |
| Connection refused on phone | Firewall, wrong IP, or app not running |
| Works on Wi‑Fi, not on LTE | Install Tailscale |
| IP changed after router reboot | Update `AUTH_URL` (or use Tailscale IP — stable) |
| Photos won't upload on phone | Same `AUTH_URL`; check `proxyClientMaxBodySize` in `next.config.ts` |

---

## Architecture

```
                    ┌─────────────────┐
                    │  MacBook (Memoria) │
                    │  :3000 on 0.0.0.0  │
                    └────────┬──────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
    LAN 192.168.x.x    Tailscale 100.x.x.x   localhost
    (same Wi‑Fi)       (any network)         (Safari on Mac)
```
