#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="docker-compose.local.yml"

echo ""
echo "Starting Memoria dev server..."

# Check database before Next.js starts (common reason the app 'doesn't work')
if command -v docker >/dev/null 2>&1; then
  if docker compose -f "$COMPOSE_FILE" ps --status running 2>/dev/null | grep -q postgres; then
    echo "  ✓ PostgreSQL container is running"
  else
    echo ""
    echo "  ⚠️  PostgreSQL is NOT running."
    echo "     The site will load, but login and data will fail."
    echo "     In another terminal run:  task db:up"
    echo ""
  fi
else
  echo "  ⚠️  Docker not found — database must be running for login to work"
fi

echo ""
echo "  When you see '✓ Ready' below, open:  http://localhost:3000"
echo "  This terminal stays open while the server runs — that is correct."
echo "  Stop the server with Ctrl+C."
echo ""

export NEXT_TELEMETRY_DISABLED=1

HOST="${DEV_HOST:-127.0.0.1}"
PORT="${PORT:-3000}"
USE_WEBPACK="${DEV_WEBPACK:-1}"

if [[ "$USE_WEBPACK" == "1" ]]; then
  echo "Using webpack dev server (set DEV_WEBPACK=0 to try Turbopack)"
  exec next dev --webpack -H "$HOST" -p "$PORT"
else
  echo "Using Turbopack dev server"
  exec next dev --turbo -H "$HOST" -p "$PORT"
fi
