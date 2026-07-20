#!/usr/bin/env bash
# Database + storage backup
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
# shellcheck source=lib.sh
source "$ROOT_DIR/scripts/prod/lib.sh"

load_env

BACKUP_DIR="${1:-./backups}"
STAMP=$(date +%Y%m%d-%H%M%S)
DEST="$BACKUP_DIR/memoria-$STAMP"
mkdir -p "$DEST"

log "Backing up DB → $DEST/database.sql"
compose exec -T postgres pg_dump -U "${POSTGRES_USER:-memoria}" "${POSTGRES_DB:-memoria}" > "$DEST/database.sql"

STORAGE="${STORAGE_PATH:-./storage}"
if [[ -d "$STORAGE" ]]; then
  log "Backing up storage → $DEST/storage.tar.gz"
  tar -czf "$DEST/storage.tar.gz" -C "$(dirname "$STORAGE")" "$(basename "$STORAGE")"
fi

cp "$ENV_FILE" "$DEST/env.backup" 2>/dev/null || true

log "Done: $DEST"
du -sh "$DEST"
