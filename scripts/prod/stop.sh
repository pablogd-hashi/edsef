#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
# shellcheck source=lib.sh
source "$ROOT_DIR/scripts/prod/lib.sh"

load_env

log "Parando Postgres + Redis (la app Next.js se detiene con Ctrl+C si corre en primer plano)"
compose down

echo "✓ Servicios Docker detenidos. Datos en volúmenes memoria_postgres / memoria_redis."
