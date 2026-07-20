#!/usr/bin/env bash
# Start Memoria in production (always-on MacBook).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
# shellcheck source=lib.sh
source "$ROOT_DIR/scripts/prod/lib.sh"

load_env

log "Postgres + Redis"
compose up -d
wait_postgres

log "Database migrations"
prisma_cmd migrate deploy

if needs_build; then
  log "Building app (new install or code changed since last build)..."
  npm run build
  write_build_fingerprint
else
  log "Using existing build"
fi

export NODE_ENV=production
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-3000}"

IP=$(lan_ip)
echo
echo "  Memoria at http://localhost:$PORT"
[[ -n "$IP" ]] && echo "  iPhone/iPad (same Wi‑Fi): http://$IP:$PORT"
echo "  AUTH_URL in .env must match the browser URL"
echo "  Remote access: docs/remote-access.md"
echo

exec npm start
