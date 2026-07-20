#!/usr/bin/env bash
# Actualizar código en producción (tras git pull)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
# shellcheck source=lib.sh
source "$ROOT_DIR/scripts/prod/lib.sh"

load_env

log "Dependencias"
npm ci

log "Migraciones"
npx prisma migrate deploy

log "Build"
npm run build

echo "✓ Actualizado. Reinicia: ./scripts/prod/start.sh"
