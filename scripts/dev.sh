#!/usr/bin/env bash
set -euo pipefail

# Flush hints immediately (before Next.js loads — can take a while on Mac)
echo ""
echo "Starting Memoria dev server..."
echo "  → Open http://localhost:3000 when you see 'Ready'"
echo "  → First start can take 1–2 minutes after git pull"
echo "  → Press Ctrl+C to stop"
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
