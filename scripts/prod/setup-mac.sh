#!/usr/bin/env bash
# Primer arranque en MacBook (M1+): crea .env, levanta DB, migra y build.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
# shellcheck source=lib.sh
source "$ROOT_DIR/scripts/prod/lib.sh"

echo "╔══════════════════════════════════════════╗"
echo "║  Memoria — setup producción (Mac)        ║"
echo "╚══════════════════════════════════════════╝"
echo

require_cmd node
require_cmd npm
require_cmd docker
require_cmd openssl

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
[[ "$NODE_MAJOR" -ge 20 ]] || die "Necesitas Node.js 20+ (tienes $(node -v))"

if [[ ! -f "$ENV_FILE" ]]; then
  log "Creando $ENV_FILE desde .env.production.example"
  cp .env.production.example "$ENV_FILE"

  PG_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
  AUTH_SEC=$(openssl rand -base64 32)

  if [[ "$(uname)" == "Darwin" ]]; then
    sed -i '' "s/CAMBIA_ESTA_CLAVE_SEGURA/$PG_PASS/g" "$ENV_FILE"
    sed -i '' "s/CAMBIA_ESTE_SECRETO_MIN_32_CARACTERES/$AUTH_SEC/g" "$ENV_FILE"
  else
    sed -i "s/CAMBIA_ESTA_CLAVE_SEGURA/$PG_PASS/g" "$ENV_FILE"
    sed -i "s/CAMBIA_ESTE_SECRETO_MIN_32_CARACTERES/$AUTH_SEC/g" "$ENV_FILE"
  fi

  IP=$(lan_ip)
  if [[ -n "$IP" ]]; then
    log "Detectada IP LAN: $IP (puedes usarla en AUTH_URL para iPhone)"
  fi
else
  log "Usando $ENV_FILE existente"
fi

load_env

mkdir -p "${STORAGE_PATH:-./storage}"

log "Instalando dependencias (npm ci)"
npm ci

log "Levantando Postgres + Redis"
compose up -d
wait_postgres

log "Aplicando migraciones"
npx prisma migrate deploy

if [[ "${1:-}" == "--seed" ]]; then
  log "Cargando datos demo (Bianca)"
  npm run db:seed
  echo
  echo "  Demo: demo@memoria.app / demo1234"
  echo "  Cambia la contraseña o crea tu cuenta y pon ALLOW_REGISTRATION=false"
fi

log "Build de producción"
npm run build

echo
echo "════════════════════════════════════════════"
echo "  Setup listo."
echo
echo "  Arrancar:  ./scripts/prod/start.sh"
echo "  Parar:     ./scripts/prod/stop.sh"
echo "  Backup:    ./scripts/prod/backup.sh"
echo
IP=$(lan_ip)
echo "  Local:     http://localhost:${PORT:-3000}"
[[ -n "$IP" ]] && echo "  Red WiFi:  http://${IP}:${PORT:-3000}"
echo "════════════════════════════════════════════"
