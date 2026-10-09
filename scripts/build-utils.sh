#!/usr/bin/env bash
# Shared build fingerprint for local family + production scripts.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Scripts run directly (task up, LaunchAgents) don't get npm's PATH — expose local binaries.
export PATH="$ROOT_DIR/node_modules/.bin:$PATH"

source_fingerprint() {
  local git_head="nogit"
  if git -C "$ROOT_DIR" rev-parse HEAD >/dev/null 2>&1; then
    git_head=$(git -C "$ROOT_DIR" rev-parse HEAD)
  fi
  local lock_hash="nolock"
  if [[ -f "$ROOT_DIR/package-lock.json" ]]; then
    if command -v shasum >/dev/null 2>&1; then
      lock_hash=$(shasum -a 256 "$ROOT_DIR/package-lock.json" | awk '{print $1}')
    else
      lock_hash=$(sha256sum "$ROOT_DIR/package-lock.json" | awk '{print $1}')
    fi
  fi
  local schema_hash="noschema"
  if [[ -f "$ROOT_DIR/prisma/schema.prisma" ]]; then
    if command -v shasum >/dev/null 2>&1; then
      schema_hash=$(shasum -a 256 "$ROOT_DIR/prisma/schema.prisma" | awk '{print $1}')
    else
      schema_hash=$(sha256sum "$ROOT_DIR/prisma/schema.prisma" | awk '{print $1}')
    fi
  fi
  echo "${git_head}:${lock_hash}:${schema_hash}"
}

needs_build() {
  [[ ! -d "$ROOT_DIR/.next" ]] && return 0
  local marker="$ROOT_DIR/.next/.source-fingerprint"
  local current
  current=$(source_fingerprint)
  [[ -f "$marker" ]] && [[ "$(cat "$marker")" == "$current" ]] && return 1
  return 0
}

write_build_fingerprint() {
  mkdir -p "$ROOT_DIR/.next"
  source_fingerprint > "$ROOT_DIR/.next/.source-fingerprint"
}

stop_port() {
  local port="${1:-3000}"
  local pids
  pids="$(lsof -nP -iTCP:"${port}" -sTCP:LISTEN -t 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    # shellcheck disable=SC2086
    kill $pids 2>/dev/null || true
    sleep 0.5
    # shellcheck disable=SC2086
    kill -9 $pids 2>/dev/null || true
  fi
  pkill -f "next dev.*-p ${port}" 2>/dev/null || true
  rm -f "$ROOT_DIR/.next/dev/lock" 2>/dev/null || true
}
