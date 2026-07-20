#!/usr/bin/env bash
# First-time MacBook (M1+) setup: create .env, start DB, migrate, build.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
# shellcheck source=lib.sh
source "$ROOT_DIR/scripts/prod/lib.sh"

echo "╔══════════════════════════════════════════╗"
echo "║  Memoria — production setup (Mac)        ║"
echo "╚══════════════════════════════════════════╝"
echo

require_cmd node
require_cmd npm
require_cmd docker
require_cmd openssl

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
[[ "$NODE_MAJOR" -ge 20 ]] || die "Node.js 20+ required (you have $(node -v))"

if [[ ! -f "$ENV_FILE" ]]; then
  log "Creating $ENV_FILE from .env.production.example"
  cp .env.production.example "$ENV_FILE"

  PG_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
  AUTH_SEC=$(openssl rand -base64 32)

  if [[ "$(uname)" == "Darwin" ]]; then
    sed -i '' "s/CHANGE_THIS_SECURE_PASSWORD/$PG_PASS/g" "$ENV_FILE"
    sed -i '' "s/CHANGE_THIS_SECRET_MIN_32_CHARACTERS/$AUTH_SEC/g" "$ENV_FILE"
  else
    sed -i "s/CHANGE_THIS_SECURE_PASSWORD/$PG_PASS/g" "$ENV_FILE"
    sed -i "s/CHANGE_THIS_SECRET_MIN_32_CHARACTERS/$AUTH_SEC/g" "$ENV_FILE"
  fi

  IP=$(lan_ip)
  if [[ -n "$IP" ]]; then
    set_auth_url "http://$IP:3000"
    log "Set AUTH_URL to http://$IP:3000 for iPhone/LAN access"
  fi
else
  log "Using existing $ENV_FILE"
fi

load_env

mkdir -p "${STORAGE_PATH:-./storage}"

log "Installing dependencies (npm ci)"
npm ci

log "Starting Postgres + Redis"
compose up -d
wait_postgres

log "Applying migrations"
npx prisma migrate deploy

if [[ "${1:-}" == "--seed" ]]; then
  log "Loading demo data (Bianca)"
  npm run db:seed
  echo
  echo "  Demo: demo@memoria.app / demo1234"
  echo "  Change the password or create your account and set ALLOW_REGISTRATION=false"
fi

log "Production build"
npm run build

echo
echo "════════════════════════════════════════════"
echo "  Setup complete."
echo
echo "  Start:     ./scripts/prod/start.sh"
echo "  Stop:      ./scripts/prod/stop.sh"
echo "  Backup:    ./scripts/prod/backup.sh"
echo
IP=$(lan_ip)
echo "  Local:     http://localhost:${PORT:-3000}"
[[ -n "$IP" ]] && echo "  LAN:       http://${IP}:${PORT:-3000}"
echo "  AUTH_URL:  ${AUTH_URL:-not set}"
echo "  Phone help: docs/remote-access.md"
echo "════════════════════════════════════════════"
