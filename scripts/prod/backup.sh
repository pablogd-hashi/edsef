#!/usr/bin/env bash
# Full Memoria backup: database + every photo/video, verified with checksums.
#
#   ./scripts/prod/backup.sh            → $BACKUP_DIR (default ~/Memoria-Backups)
#   ./scripts/prod/backup.sh /Volumes/X → one-off backup into another folder
#
# Each backup is a folder you can restore with ./scripts/prod/restore.sh:
#   database.dump   pg_dump custom format
#   storage.tar     ./storage without exports/backups (photos are already compressed)
#   manifest.json   date, app version, checksums, row counts
#
# Keeps the 14 newest backups plus one per month for 12 months. When
# BACKUP_EXTERNAL_DIR is set and mounted (USB/SSD), the new backup is copied there too.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=lib.sh
source "$ROOT_DIR/scripts/prod/lib.sh"

load_env
detect_compose

DEST_ROOT="${1:-$(backup_root)}"
STORAGE="$(storage_root)"
STAMP=$(date +%Y%m%d-%H%M%S)
NAME="memoria-$STAMP"
mkdir -p "$DEST_ROOT"

LOCK="$DEST_ROOT/.backup.lock"
if ! mkdir "$LOCK" 2>/dev/null; then
  die "Another backup is running (remove $LOCK if that is not true)."
fi
PARTIAL="$DEST_ROOT/.$NAME.partial"
cleanup() {
  rm -rf "$PARTIAL"
  rmdir "$LOCK" 2>/dev/null || true
}
trap cleanup EXIT
mkdir -p "$PARTIAL"

log "Database → database.dump"
pg_tool pg_dump --format=custom --no-owner --no-privileges > "$PARTIAL/database.dump"
[[ -s "$PARTIAL/database.dump" ]] || die "Database dump is empty"

log "Photos & videos → storage.tar"
if [[ -d "$STORAGE" ]]; then
  tar -cf "$PARTIAL/storage.tar" -C "$STORAGE" \
    --exclude=./exports --exclude=./backups --exclude=./.status --exclude=./tmp .
else
  log "No storage folder at $STORAGE (nothing uploaded yet)"
  tar -cf "$PARTIAL/storage.tar" -T /dev/null
fi

log "Checksums"
DB_SHA=$(sha256_of "$PARTIAL/database.dump")
TAR_SHA=$(sha256_of "$PARTIAL/storage.tar")
DB_SIZE=$(file_size "$PARTIAL/database.dump")
TAR_SIZE=$(file_size "$PARTIAL/storage.tar")
FILE_COUNT=$(tar -tf "$PARTIAL/storage.tar" | grep -cv '/$' || true)
APP_VERSION=$(git -C "$ROOT_DIR" rev-parse --short HEAD 2>/dev/null || echo unknown)
COUNTS_JSON=$(table_counts | awk -F= 'NF==2 {printf "%s\"%s\": %s", (n++ ? ", " : ""), $1, $2}')

cat > "$PARTIAL/manifest.json" <<JSON
{
  "format": "memoria-backup-v2",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "appVersion": "$APP_VERSION",
  "files": {
    "database.dump": { "sha256": "$DB_SHA", "bytes": $DB_SIZE },
    "storage.tar": { "sha256": "$TAR_SHA", "bytes": $TAR_SIZE, "fileCount": $FILE_COUNT }
  },
  "rows": { $COUNTS_JSON }
}
JSON

mv "$PARTIAL" "$DEST_ROOT/$NAME"
log "Saved $DEST_ROOT/$NAME ($(du -sh "$DEST_ROOT/$NAME" | awk '{print $1}'), $FILE_COUNT files)"

# Keep 14 newest + newest of each month for 12 months.
prune() {
  local dir="$1" kept=0 months_kept=0 seen_months=" " b month
  while IFS= read -r b; do
    month=$(basename "$b" | cut -c9-14)
    if (( kept < 14 )); then
      kept=$((kept + 1))
      seen_months+="$month "
      continue
    fi
    if [[ "$seen_months" != *" $month "* ]] && (( months_kept < 12 )); then
      months_kept=$((months_kept + 1))
      seen_months+="$month "
      continue
    fi
    log "Pruning old backup $(basename "$b")"
    rm -rf "$b"
  done < <(find "$dir" -maxdepth 1 -type d -name 'memoria-2*' | sort -r)
}

EXTERNAL_COPIED=""
if [[ -z "${1:-}" ]]; then
  prune "$DEST_ROOT"
  if [[ -n "${BACKUP_EXTERNAL_DIR:-}" ]]; then
    if [[ -d "$BACKUP_EXTERNAL_DIR" ]]; then
      log "Copying to external drive $BACKUP_EXTERNAL_DIR"
      rsync -a "$DEST_ROOT/$NAME" "$BACKUP_EXTERNAL_DIR/"
      prune "$BACKUP_EXTERNAL_DIR"
      EXTERNAL_COPIED=1
    else
      log "External drive not mounted ($BACKUP_EXTERNAL_DIR) — skipped this time"
    fi
  fi

  # Status for the app's Health page; keeps the last external copy date across runs.
  STATUS_FILE="$DEST_ROOT/status.json" NAME="$NAME" EXTERNAL_COPIED="$EXTERNAL_COPIED" node -e '
    const fs = require("fs");
    const file = process.env.STATUS_FILE;
    let prev = {};
    try { prev = JSON.parse(fs.readFileSync(file, "utf8")); } catch {}
    const now = new Date().toISOString();
    fs.writeFileSync(file, JSON.stringify({
      lastBackupAt: now,
      lastBackup: process.env.NAME,
      externalCopiedAt: process.env.EXTERNAL_COPIED ? now : (prev.externalCopiedAt ?? null),
    }, null, 2) + "\n");
  '
fi

echo "✓ Backup complete: $DEST_ROOT/$NAME"
