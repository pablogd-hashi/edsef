#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
# shellcheck source=lib.sh
source "$ROOT_DIR/scripts/prod/lib.sh"

load_env

log "Stopping Postgres + Redis (stop Next.js with Ctrl+C if running in foreground)"
compose down

echo "✓ Docker services stopped. Data kept in volumes memoria_postgres / memoria_redis."
