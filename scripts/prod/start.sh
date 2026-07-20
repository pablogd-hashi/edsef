#!/usr/bin/env bash
# Arranca Memoria en producción (MacBook siempre encendido).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
# shellcheck source=lib.sh
source "$ROOT_DIR/scripts/prod/lib.sh"

load_env

log "Postgres + Redis"
compose up -d
wait_postgres

if [[ ! -d .next ]]; then
  log "Build inicial..."
  npm run build
fi

export NODE_ENV=production
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-3000}"

IP=$(lan_ip)
echo
echo "  Memoria en http://localhost:$PORT"
[[ -n "$IP" ]] && echo "  Desde iPhone/iPad (misma WiFi): http://$IP:$PORT"
echo "  AUTH_URL en .env debe coincidir con la URL del navegador"
echo

exec npm start
