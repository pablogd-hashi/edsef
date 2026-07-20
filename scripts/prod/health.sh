#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
# shellcheck source=lib.sh
source "$ROOT_DIR/scripts/prod/lib.sh"

load_env
PORT="${PORT:-3000}"

echo "Docker:"
compose ps

echo
echo "HTTP:"
PING=$(curl -sf "http://127.0.0.1:$PORT/api/ping" 2>/dev/null || true)
if [[ -n "$PING" ]]; then
  echo "$PING"
  if echo "$PING" | grep -q '"db":false'; then
    echo "⚠ Database not ready — run: npx prisma migrate deploy"
  fi
else
  echo "App not responding on :$PORT (run ./scripts/prod/start.sh?)"
fi

echo
IP=$(lan_ip)
[[ -n "$IP" ]] && echo "LAN: http://$IP:$PORT"
echo "AUTH_URL: ${AUTH_URL:-not set}"
[[ "${AUTH_URL:-}" == *localhost* ]] && [[ -n "$IP" ]] && echo "⚠ AUTH_URL uses localhost — phone on Wi‑Fi needs http://$IP:$PORT (see docs/remote-access.md)"
