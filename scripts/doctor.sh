#!/usr/bin/env bash
set -euo pipefail

echo "Memoria dev environment check"
echo "=============================="
echo "Node:     $(node -v 2>/dev/null || echo 'NOT FOUND — install Node 20+')"
echo "npm:      $(npm -v 2>/dev/null || echo 'NOT FOUND')"
echo "Port 3000: $(lsof -i :3000 2>/dev/null | head -3 || echo 'free')"
echo ""
echo "Project:"
echo "  .env:        $([ -f .env ] && echo 'ok' || echo 'MISSING — run: cp .env.example .env')"
echo "  node_modules: $([ -d node_modules ] && echo 'ok' || echo 'MISSING — run: npm install')"
echo "  .next cache: $([ -d .next ] && du -sh .next | cut -f1 || echo 'none')"
if [[ -d storage ]]; then
  echo "  storage/:     $(du -sh storage | cut -f1) — large folders can slow dev startup"
else
  echo "  storage/:     none"
fi
echo ""
echo "Docker:"
docker compose -f docker-compose.local.yml ps 2>/dev/null || echo "  not running (run: task db:up)"
echo ""
echo "If npm run dev hangs with no output, try:"
echo "  rm -rf .next && npm run dev"
echo "  DEV_WEBPACK=1 npm run dev    # webpack (default, more reliable)"
echo "  DEV_HOST=0.0.0.0 npm run dev # phone access on LAN"
