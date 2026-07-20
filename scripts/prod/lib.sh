#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"

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
