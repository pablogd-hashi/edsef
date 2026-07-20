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
curl -sf "http://127.0.0.1:$PORT/api/ping" 2>/dev/null && echo || echo "App no responde en :$PORT (¿./scripts/prod/start.sh?)"

echo
IP=$(lan_ip)
[[ -n "$IP" ]] && echo "LAN: http://$IP:$PORT"
