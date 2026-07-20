#!/usr/bin/env bash
# Update production after git pull
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
# shellcheck source=lib.sh
source "$ROOT_DIR/scripts/prod/lib.sh"

load_env

log "Dependencies"
npm ci

log "Migrations"
npx prisma migrate deploy

log "Build"
npm run build
write_build_fingerprint

echo "✓ Updated. Restart: ./scripts/prod/start.sh"
