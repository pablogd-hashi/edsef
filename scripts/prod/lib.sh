#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

# LaunchAgents and the app's "Backup now" button start with a minimal PATH.
export PATH="$PATH:/opt/homebrew/bin:/usr/local/bin:/Applications/Docker.app/Contents/Resources/bin"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"

log() { echo "→ $*"; }
die() { echo "✗ $*" >&2; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing '$1'. Install it and try again."
}

load_env() {
  [[ -f "$ENV_FILE" ]] || die "Missing $ENV_FILE. Run first: ./scripts/prod/setup-mac.sh"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
}

lan_ip() {
  if [[ "$(uname)" == "Darwin" ]]; then
    ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true
  else
    hostname -I 2>/dev/null | awk '{print $1}' || true
  fi
}

set_auth_url() {
  local url="$1"
  if [[ "$(uname)" == "Darwin" ]]; then
    sed -i '' "s|^AUTH_URL=.*|AUTH_URL=\"$url\"|" "$ENV_FILE"
  else
    sed -i "s|^AUTH_URL=.*|AUTH_URL=\"$url\"|" "$ENV_FILE"
  fi
}

compose() {
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
}

wait_postgres() {
  local user="${POSTGRES_USER:-memoria}"
  local db="${POSTGRES_DB:-memoria}"
  local i
  for i in {1..30}; do
    if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
      pg_isready -U "$user" -d "$db" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  die "Postgres did not become ready in time"
}

require_node_modules() {
  if [[ ! -x "$ROOT_DIR/node_modules/.bin/prisma" ]]; then
    die "Dependencies not installed. Run: npm ci  (or ./scripts/prod/setup-mac.sh)"
  fi
}

# Use the project's Prisma 6 CLI — never npx prisma (downloads Prisma 7+).
prisma_cmd() {
  require_node_modules
  npm exec -- prisma "$@"
}

# Fingerprint sources so start.sh rebuilds after git pull without manual steps.
source_fingerprint() {
  local git_head="nogit"
  if git rev-parse HEAD >/dev/null 2>&1; then
    git_head=$(git rev-parse HEAD)
  fi
  local lock_hash="nolock"
  if [[ -f package-lock.json ]]; then
    lock_hash=$(sha256sum package-lock.json | awk '{print $1}')
  fi
  local schema_hash="noschema"
  if [[ -f prisma/schema.prisma ]]; then
    schema_hash=$(sha256sum prisma/schema.prisma | awk '{print $1}')
  fi
  echo "${git_head}:${lock_hash}:${schema_hash}"
}

needs_build() {
  [[ ! -d .next ]] && return 0
  local marker=".next/.source-fingerprint"
  local current
  current=$(source_fingerprint)
  [[ -f "$marker" ]] && [[ "$(cat "$marker")" == "$current" ]] && return 1
  return 0
}

write_build_fingerprint() {
  mkdir -p .next
  source_fingerprint > .next/.source-fingerprint
}

# ─── Database access for backup/restore ──────────────────────────────────────
# MEMORIA_PG_MODE=docker (default): run pg tools inside the Postgres container.
# MEMORIA_PG_MODE=direct: use host pg tools against DATABASE_URL (CI, Postgres.app).

# The family server uses docker-compose.local.yml, the production install
# docker-compose.prod.yml — pick whichever has Postgres running.
detect_compose() {
  [[ "${MEMORIA_PG_MODE:-docker}" == "direct" ]] && return 0
  local f
  for f in "$COMPOSE_FILE" docker-compose.prod.yml docker-compose.local.yml; do
    [[ -f "$f" ]] || continue
    if docker compose -f "$f" --env-file "$ENV_FILE" ps --status running --services 2>/dev/null \
      | grep -qx postgres; then
      COMPOSE_FILE="$f"
      return 0
    fi
  done
  die "Postgres is not running. Start it first (task up, or ./scripts/prod/start.sh)."
}

# DATABASE_URL without ?schema=… (pg tools reject Prisma's query params).
pg_url() {
  echo "${DATABASE_URL%%\?*}"
}

pg_tool() {
  local tool="$1"; shift
  if [[ "${MEMORIA_PG_MODE:-docker}" == "direct" ]]; then
    "$tool" "$@" --dbname="$(pg_url)"
  else
    compose exec -T postgres "$tool" "$@" \
      --username="${POSTGRES_USER:-memoria}" --dbname="${POSTGRES_DB:-memoria}"
  fi
}

sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

file_size() {
  if [[ "$(uname)" == "Darwin" ]]; then stat -f %z "$1"; else stat -c %s "$1"; fi
}

backup_root() {
  echo "${BACKUP_DIR:-$HOME/Memoria-Backups}"
}

storage_root() {
  local s="${STORAGE_PATH:-./storage}"
  [[ "$s" = /* ]] || s="$ROOT_DIR/${s#./}"
  echo "$s"
}

# Row counts of the tables that hold family memories (compared after a restore).
table_counts() {
  pg_tool psql -tA -F= -c "
    SELECT 'users', count(*) FROM \"User\"
    UNION ALL SELECT 'children', count(*) FROM \"Child\"
    UNION ALL SELECT 'yearbooks', count(*) FROM \"Yearbook\"
    UNION ALL SELECT 'media', count(*) FROM \"MediaAsset\"
    UNION ALL SELECT 'milestones', count(*) FROM \"Milestone\"
    UNION ALL SELECT 'timeline', count(*) FROM \"TimelineEntry\"
    UNION ALL SELECT 'stories', count(*) FROM \"Story\"
    UNION ALL SELECT 'notes', count(*) FROM \"ParentNote\";"
}
