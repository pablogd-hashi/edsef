#!/usr/bin/env bash
set -euo pipefail

echo "Memoria dev environment check"
echo "=============================="
echo "Node:     $(node -v 2>/dev/null || echo 'NOT FOUND — install Node 20+')"
echo "npm:      $(npm -v 2>/dev/null || echo 'NOT FOUND')"
echo "Port 3000: $(lsof -i :3000 2>/dev/null | head -3 || echo 'free')"
echo ""
echo "Project:"
echo "  path:         $(pwd)"
echo "  .env:         $([ -f .env ] && echo 'ok' || echo 'MISSING — run: cp .env.example .env')"
echo "  node_modules: $([ -d node_modules ] && echo 'ok' || echo 'MISSING — run: npm install')"
echo "  .next cache:  $([ -d .next ] && du -sh .next | cut -f1 || echo 'none')"
if [[ -d storage ]]; then
  echo "  storage/:     $(du -sh storage | cut -f1) — large folders can slow Turbopack"
else
  echo "  storage/:     none"
fi

# iCloud / Optimize Mac Storage — #1 cause of hung `next` on Mac
DATALESS=0
if [[ -d node_modules ]]; then
  DATALESS=$(find node_modules -type f -flags +dataless 2>/dev/null | wc -l | tr -d ' ')
fi
ICLOUD=0
if xattr -l . 2>/dev/null | grep -qi 'fileprovider\|icloud'; then
  ICLOUD=1
fi
case "$(pwd)" in
  */Documents/*|*/Desktop/*|*/Library/Mobile Documents/*) ICLOUD=1 ;;
esac

echo ""
echo "macOS / iCloud:"
if [[ "$ICLOUD" -eq 1 ]]; then
  echo "  ⚠ Project looks iCloud-synced (Documents/Desktop or File Provider attrs)"
else
  echo "  path:         looks local (good)"
fi
if [[ "$DATALESS" -gt 0 ]]; then
  echo "  ⚠ dataless files in node_modules: $DATALESS"
  echo "     macOS evicted package files to iCloud — Next.js hangs on startup."
  echo "     Fix: bash scripts/relocate-from-icloud.sh"
  echo "     Then open ~/Developer/edsef-diary/edsef and run task up"
else
  echo "  dataless:     0 (good)"
fi

echo ""
echo "Docker:"
docker compose -f docker-compose.local.yml ps 2>/dev/null || echo "  not running (run: task db:up)"
echo ""
echo "If npm run dev hangs with no Ready:"
echo "  task doctor"
echo "  bash scripts/relocate-from-icloud.sh   # if dataless > 0"
echo "  rm -rf .next && npm run dev"
echo "  lsof -i :3000 && pkill -f 'next-server' || true"
