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

# Fail fast: iCloud-evicted node_modules make `next` hang forever in pread().
_dataless=0
if [[ -d node_modules ]]; then
  _dataless=$(find node_modules -type f -flags +dataless 2>/dev/null | wc -l | tr -d ' ')
fi
if [[ "${_dataless}" -gt 0 ]]; then
  echo "✗ Cannot start: ${_dataless} files in node_modules were evicted by iCloud (dataless)."
  echo "  Next.js hangs reading those files — this is not a slow compile."
  echo ""
  echo "  Fix once:"
  echo "    bash scripts/relocate-from-icloud.sh"
  echo "    # then open ~/Developer/edsef-diary/edsef and run: task up"
  echo ""
  exit 1
fi

# Clear orphaned next-server holding PORT / .next/dev/lock (accepts TCP but never responds).
_clear_stale_next() {
  local pids
  pids="$(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null || true)"
  if [[ -z "$pids" && ! -f .next/dev/lock ]]; then
    return 0
  fi

  local healthy=0
  if [[ -n "$pids" ]]; then
    if curl -sf -m 1 "http://127.0.0.1:${PORT}/api/ping" >/dev/null 2>&1 \
      || curl -sf -m 1 "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
      healthy=1
    fi
  fi

  if [[ "$healthy" -eq 1 ]]; then
    echo "Port $PORT is already serving Memoria. Stop it first, or open http://127.0.0.1:$PORT"
    exit 1
  fi

  if [[ -n "$pids" || -f .next/dev/lock ]]; then
    echo "Clearing stale Next.js process on port $PORT..."
    if [[ -n "$pids" ]]; then
      # shellcheck disable=SC2086
      kill $pids 2>/dev/null || true
      sleep 0.5
      # shellcheck disable=SC2086
      kill -9 $pids 2>/dev/null || true
    fi
    pkill -f "next dev.*-p ${PORT}" 2>/dev/null || true
    rm -f .next/dev/lock 2>/dev/null || true
    echo "  → Cleared. Starting fresh."
  fi
}
_clear_stale_next

if [[ "$USE_WEBPACK" == "1" ]]; then
  echo "Using webpack dev server (set DEV_WEBPACK=0 to try Turbopack)"
  exec next dev --webpack -H "$HOST" -p "$PORT"
else
  echo "Using Turbopack dev server"
  exec next dev --turbo -H "$HOST" -p "$PORT"
fi
