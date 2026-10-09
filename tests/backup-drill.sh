#!/usr/bin/env bash
# Restore drill: back up a populated database + photo folder, damage both,
# restore, and check that every row and file came back byte-for-byte.
#
# Needs a THROWAWAY Postgres reachable via DATABASE_URL (it is wiped!).
#   CI:    MEMORIA_PG_MODE=direct DATABASE_URL=postgres://… bash tests/backup-drill.sh
#   Local: bash tests/backup-drill.sh --docker   (starts its own temporary Postgres)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

WORK="$(mktemp -d "${TMPDIR:-/tmp}/memoria-drill.XXXXXX")"
DOCKER_PROJECT=""
cleanup() {
  [[ -n "$DOCKER_PROJECT" ]] && docker compose -p "$DOCKER_PROJECT" -f "$WORK/compose.yml" down -v >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

if [[ "${1:-}" == "--docker" ]]; then
  DOCKER_PROJECT="memoria-drill-$$"
  PORT=$(node -e 'const s=require("net").createServer().listen(0,"127.0.0.1",()=>{console.log(s.address().port);s.close()})')
  cat > "$WORK/compose.yml" <<YAML
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: memoria
      POSTGRES_PASSWORD: drill
      POSTGRES_DB: memoria
    ports:
      - "127.0.0.1:${PORT}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U memoria -d memoria"]
      interval: 1s
      retries: 30
YAML
  docker compose -p "$DOCKER_PROJECT" -f "$WORK/compose.yml" up -d --wait >/dev/null
  export DATABASE_URL="postgresql://memoria:drill@127.0.0.1:${PORT}/memoria"
  export MEMORIA_PG_MODE=docker
  export COMPOSE_FILE="$WORK/compose.yml"
  export COMPOSE_PROJECT_NAME="$DOCKER_PROJECT"
  export POSTGRES_USER=memoria POSTGRES_DB=memoria
else
  export MEMORIA_PG_MODE="${MEMORIA_PG_MODE:-direct}"
fi
: "${DATABASE_URL:?Set DATABASE_URL to a throwaway database}"

export STORAGE_PATH="$WORK/storage"
export BACKUP_DIR="$WORK/backups"
export ENV_FILE="$WORK/drill.env"
unset BACKUP_EXTERNAL_DIR
: > "$ENV_FILE"

echo "→ Creating schema and sample family"
npm exec -- prisma migrate deploy >/dev/null
SQL_SEED=$(cat <<'SQL'
INSERT INTO "User"(id, email, name, "updatedAt") VALUES ('u1','ana@example.com','Ana', now());
INSERT INTO "Family"(id, name, "updatedAt") VALUES ('f1','Familia', now());
INSERT INTO "FamilyMember"(id, "familyId", "userId", role, "updatedAt") VALUES ('m1','f1','u1','OWNER', now());
INSERT INTO "Child"(id, "familyId", "fullName", "birthDate", "updatedAt") VALUES
  ('c1','f1','Lucía','2020-03-01', now()), ('c2','f1','Martina','2022-07-15', now()), ('c3','f1','Olivia','2025-01-20', now());
INSERT INTO "Yearbook"(id, "childId", title, "updatedAt") VALUES ('y1','c1','Año 1', now());
INSERT INTO "MediaAsset"(id, "childId", type, "originalFilename", "mimeType", size, "storageKey", "updatedAt")
  VALUES ('a1','c1','IMAGE','playa.jpg','image/jpeg',5,'media/f1/c1/a1/original.jpg', now());
SQL
)
# shellcheck source=../scripts/prod/lib.sh
( source scripts/prod/lib.sh; detect_compose; pg_tool psql -v ON_ERROR_STOP=1 -q -c "$SQL_SEED" )
mkdir -p "$STORAGE_PATH/media/f1/c1/a1" "$STORAGE_PATH/exports/f1"
head -c 200000 /dev/urandom > "$STORAGE_PATH/media/f1/c1/a1/original.jpg"
echo "export" > "$STORAGE_PATH/exports/f1/old.zip"
ORIGINAL_SHA=$(shasum -a 256 "$STORAGE_PATH/media/f1/c1/a1/original.jpg" | awk '{print $1}')

echo "→ Backing up"
bash scripts/prod/backup.sh >/dev/null
SNAP="$(find "$BACKUP_DIR" -maxdepth 1 -type d -name 'memoria-2*' | head -1)"
[[ -n "$SNAP" ]] || { echo "✗ no backup produced"; exit 1; }
tar -tf "$SNAP/storage.tar" | grep -q exports && { echo "✗ exports leaked into backup"; exit 1; }
[[ -f "$BACKUP_DIR/status.json" ]] || { echo "✗ status.json missing"; exit 1; }

echo "→ Damaging data"
( source scripts/prod/lib.sh; detect_compose; pg_tool psql -q -c 'DELETE FROM "Child" WHERE id = '"'"'c2'"'"'; DELETE FROM "MediaAsset";' )
rm "$STORAGE_PATH/media/f1/c1/a1/original.jpg"

echo "→ Restoring"
bash scripts/prod/restore.sh "$SNAP" --yes >/dev/null

echo "→ Verifying"
COUNTS=$( source scripts/prod/lib.sh; detect_compose; table_counts | tr '\n' ' ' )
for expected in "users=1" "children=3" "yearbooks=1" "media=1"; do
  [[ " $COUNTS " == *" $expected "* ]] || { echo "✗ expected $expected, got: $COUNTS"; exit 1; }
done
RESTORED_SHA=$(shasum -a 256 "$STORAGE_PATH/media/f1/c1/a1/original.jpg" | awk '{print $1}')
[[ "$RESTORED_SHA" == "$ORIGINAL_SHA" ]] || { echo "✗ photo checksum differs after restore"; exit 1; }
[[ -f "$STORAGE_PATH/exports/f1/old.zip" ]] || { echo "✗ exports were lost"; exit 1; }

echo "✓ Restore drill passed ($COUNTS)"
