#!/usr/bin/env bash
# Restore a backup made by ./scripts/prod/backup.sh.
#
#   ./scripts/prod/restore.sh ~/Memoria-Backups/memoria-20261009-030000
#   ./scripts/prod/restore.sh <backup-folder> --yes     (no prompt; CI / scripted moves)
#
# Replaces the database and the photo folder with the backup contents.
# The current photo folder is kept as storage.before-restore-<date> until you delete it.
# Stop the app first (Ctrl+C or launchctl unload) so nothing writes during the restore.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=lib.sh
source "$ROOT_DIR/scripts/prod/lib.sh"

BACKUP="${1:-}"
ASSUME_YES="${2:-}"
if [[ -z "$BACKUP" || ! -d "$BACKUP" ]]; then
  echo "Usage: $0 <backup-folder> [--yes]"
  echo "Backups live in ${BACKUP_DIR:-~/Memoria-Backups}"
  exit 1
fi
BACKUP="$(cd "$BACKUP" && pwd)"

for f in manifest.json database.dump storage.tar; do
  [[ -f "$BACKUP/$f" ]] || die "$f missing in $BACKUP — is this a Memoria backup folder?"
done

load_env
detect_compose

log "Verifying checksums"
expected_sha() {
  sed -n "/\"$1\"/s/.*\"sha256\": \"\([0-9a-f]*\)\".*/\1/p" "$BACKUP/manifest.json"
}
for f in database.dump storage.tar; do
  [[ "$(sha256_of "$BACKUP/$f")" == "$(expected_sha "$f")" ]] || die "$f is corrupted (checksum mismatch)"
done
log "Checksums OK"

STORAGE="$(storage_root)"
echo
echo "This will REPLACE the current database and photos with:"
echo "  $BACKUP"
echo "  $(sed -n 's/.*"createdAt": "\(.*\)".*/created \1/p' "$BACKUP/manifest.json")"
echo
if [[ "$ASSUME_YES" != "--yes" ]]; then
  read -r -p "Type RESTORE to continue: " answer
  [[ "$answer" == "RESTORE" ]] || die "Cancelled"
fi

log "Database: wiping and restoring"
pg_tool psql -v ON_ERROR_STOP=1 -q -c "SET client_min_messages = warning; DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"
pg_tool pg_restore --no-owner --no-privileges --exit-on-error < "$BACKUP/database.dump"

log "Photos: restoring into $STORAGE"
STAGING="$STORAGE.restoring"
rm -rf "$STAGING"
mkdir -p "$STAGING"
tar -xf "$BACKUP/storage.tar" -C "$STAGING"
if [[ -d "$STORAGE" ]]; then
  OLD="$STORAGE.before-restore-$(date +%Y%m%d-%H%M%S)"
  mv "$STORAGE" "$OLD"
  # Exports are rebuilt on demand; keep them so existing download links still work.
  [[ -d "$OLD/exports" ]] && mv "$OLD/exports" "$STAGING/exports"
  log "Previous photos kept at $OLD (delete it once you have checked the app)"
fi
mv "$STAGING" "$STORAGE"

log "Applying any newer database migrations"
if [[ "${MEMORIA_PG_MODE:-docker}" == "direct" ]] || [[ -x "$ROOT_DIR/node_modules/.bin/prisma" ]]; then
  prisma_cmd migrate deploy >/dev/null
fi

log "Row counts after restore:"
table_counts | sed 's/^/    /'
echo
echo "✓ Restore complete. Start the app again and check a few yearbooks."
