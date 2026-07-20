#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"

log() { echo "→ $*"; }
die() { echo "✗ $*" >&2; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Falta '$1'. Instálalo y vuelve a intentar."
}

load_env() {
  [[ -f "$ENV_FILE" ]] || die "No existe $ENV_FILE. Ejecuta primero: ./scripts/prod/setup-mac.sh"
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
  die "Postgres no respondió a tiempo"
}
