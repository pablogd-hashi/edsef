#!/usr/bin/env bash
# Move Memoria out of iCloud Documents so node_modules stay on local disk.
# Usage: bash scripts/relocate-from-icloud.sh [destination]
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="${1:-$HOME/Developer/edsef-diary/edsef}"

if [[ "$ROOT_DIR" == "$DEST" ]]; then
  echo "Already at destination: $DEST"
  exit 0
fi

if find "$ROOT_DIR/node_modules" -type f -flags +dataless 2>/dev/null | head -1 | grep -q .; then
  echo "Detected iCloud-evicted (dataless) files under node_modules."
fi

echo "Copying project (excluding node_modules / .next) →"
echo "  $DEST"
mkdir -p "$(dirname "$DEST")"
# Exclude node_modules (evicted junk) and storage (large media — iCloud download stalls rsync).
# Copy storage separately after the move if you need local photos/videos.
rsync -a \
  --exclude node_modules \
  --exclude 'node_modules *' \
  --exclude .next \
  --exclude storage \
  --exclude 'storage *' \
  --exclude 'storage 2' \
  "$ROOT_DIR/" "$DEST/"

cd "$DEST"
echo "Installing dependencies on local disk..."
rm -rf node_modules
npm install

echo ""
echo "✓ Relocated to: $DEST"
echo "  1. Open that folder in Cursor/Terminal"
echo "  2. Optionally copy storage/ when you need media (can be slow on iCloud)"
echo "  3. Run: task up"
echo "  4. Do NOT keep developing from Documents/ (iCloud will break node_modules again)"
echo ""
