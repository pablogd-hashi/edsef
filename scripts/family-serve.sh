#!/usr/bin/env bash
# Family server — production Next.js on LAN. Default for daily use + iPhone.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
# shellcheck source=build-utils.sh
source "$ROOT_DIR/scripts/build-utils.sh"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.local.yml}"
HOST="${DEV_HOST:-0.0.0.0}"
PORT="${PORT:-3000}"

echo ""
echo "Memoria family server (production mode — stable on iPhone)"
echo ""

if command -v docker >/dev/null 2>&1; then
  echo "→ Starting Postgres..."
  docker compose -f "$COMPOSE_FILE" up -d --wait
else
  echo "⚠️  Docker not found — database must already be running"
fi

echo "→ Database migrations"
npm run db:migrate:deploy

stop_port "$PORT"

if needs_build; then
  echo "→ Building app (first run or code changed)..."
  npm run build
  write_build_fingerprint
else
  echo "→ Using existing production build"
fi

echo ""
echo "  Mac:     http://localhost:${PORT}"
echo "  iPhone:  use AUTH_URL from .env (same Wi‑Fi)"
echo "  Coding:  task dev  (hot reload — not for phones)"
echo "  Stop:    Ctrl+C"
echo ""

export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
exec next start -H "$HOST" -p "$PORT"
