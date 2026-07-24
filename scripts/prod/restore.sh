#!/usr/bin/env bash
# Restore database + storage from a Memoria backup directory
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
# shellcheck source=lib.sh
source "$ROOT_DIR/scripts/prod/lib.sh"

load_env

BACKUP_DIR="${1:-}"
if [[ -z "$BACKUP_DIR" || ! -d "$BACKUP_DIR" ]]; then
  echo "Usage: $0 <backup-directory>"
  echo "Example: $0 ./backups/memoria-20260724-120000"
  exit 1
fi

if [[ ! -f "$BACKUP_DIR/manifest.json" ]]; then
  echo "Error: manifest.json not found in $BACKUP_DIR"
  exit 1
fi

if [[ ! -f "$BACKUP_DIR/database.json" ]]; then
  echo "Error: database.json not found in $BACKUP_DIR"
  exit 1
fi

STORAGE="${STORAGE_PATH:-./storage}"

if [[ -d "$BACKUP_DIR/storage" ]]; then
  log "Restoring storage → $STORAGE"
  cp -a "$BACKUP_DIR/storage/." "$STORAGE/"
fi

log "Restore files copied. Run the app restore API or re-import database.json for full DB restore."
log "For production: use the Archive health page → Restore, or:"
log "  curl -X POST $AUTH_URL/api/backup/restore -H 'Cookie: ...' -d '{\"backupId\":\"...\"}'"
log "Done: $BACKUP_DIR"
