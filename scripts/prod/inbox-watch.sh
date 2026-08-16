#!/usr/bin/env bash
# Poll the iCloud Drive inbox and import new photos into Memoria.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
# shellcheck source=lib.sh
source "$ROOT_DIR/scripts/prod/lib.sh"

load_env

exec npx tsx src/workers/inbox-watch.ts
