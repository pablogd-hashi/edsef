# Memoria en producción — MacBook M1/M2/M3

Guía para correr Memoria en tu Mac como servidor familiar. La laptop debe estar encendida y en la misma red WiFi para acceder desde iPhone/iPad.

## Requisitos

- macOS en Apple Silicon (M1+)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (solo Postgres + Redis)
- Node.js 22+ (`brew install node@22`)
- Git

## Instalación (una vez)

```bash
git clone https://github.com/pablogd-hashi/edsef.git
cd edsef
chmod +x scripts/prod/*.sh

# Crea .env con claves aleatorias, migra DB y hace build
./scripts/prod/setup-mac.sh --seed
```

El flag `--seed` carga Bianca de demo. Sin él, crea tu cuenta en `/register` antes de poner `ALLOW_REGISTRATION=false`.

## Arrancar / parar

```bash
# Producción (escucha en 0.0.0.0:3000 — accesible en la red local)
./scripts/prod/start.sh

# Parar Docker (Ctrl+C detiene la app si corre en primer plano)
./scripts/prod/stop.sh

# Estado
./scripts/prod/health.sh
```

## Acceso desde iPhone / iPad

1. Averigua la IP de tu Mac en WiFi:

```bash
ipconfig getifaddr en0
# Ejemplo: 192.168.1.42
```

2. En `.env`, pon la misma URL que usarás en el navegador:

```
AUTH_URL="http://192.168.1.42:3000"
```

3. Reinicia la app (`Ctrl+C` y `./scripts/prod/start.sh`).

4. En el iPhone (Safari): `http://192.168.1.42:3000`

> Si cambias de red WiFi, la IP puede cambiar — actualiza `AUTH_URL`.

## Seguridad (recomendado)

| Paso | Acción |
|------|--------|
| 1 | Crea tu cuenta de mamá/papá |
| 2 | En `.env`: `ALLOW_REGISTRATION=false` |
| 3 | No expongas el puerto 3000 a Internet sin VPN |
| 4 | Backups semanales: `./scripts/prod/backup.sh` |

Para acceso fuera de casa sin abrir puertos: [Tailscale](https://tailscale.com) (gratis para uso personal).

## Arranque automático al encender el Mac

```bash
# Edita rutas en el plist, luego:
cp deploy/launchd/com.memoria.plist.example ~/Library/LaunchAgents/com.memoria.plist
launchctl load ~/Library/LaunchAgents/com.memoria.plist
```

Asegúrate de que Docker Desktop arranque al login (Docker Desktop → Settings → General → Start Docker Desktop when you sign in).

## Dónde se guardan los datos

| Qué | Dónde |
|-----|-------|
| Fotos y videos | `./storage/` (o `STORAGE_PATH` en `.env`) |
| Base de datos | Volumen Docker `memoria_postgres` |
| Backups | `./backups/memoria-YYYYMMDD-HHMMSS/` |

## Exportar PDF

```bash
npx playwright install chromium
```

Luego usa **Exportar → PDF** en la app.

## Comandos npm

| Comando | Descripción |
|---------|-------------|
| `npm run prod:setup` | Alias de setup-mac.sh |
| `npm run prod:start` | Alias de start.sh |
| `npm run prod:stop` | Alias de stop.sh |
| `npm run prod:backup` | Backup DB + storage |
| `npm run db:migrate:deploy` | Migraciones en producción |

## Solución de problemas

**Login falla desde el iPhone**  
`AUTH_URL` en `.env` debe coincidir exactamente con la URL del navegador (incluido `http://` y puerto).

**No carga fotos**  
Verifica que `storage/` existe y tiene permisos de escritura.

**Postgres no arranca**  
`docker compose -f docker-compose.prod.yml --env-file .env logs postgres`

**Puerto 3000 ocupado**  
Cambia `PORT=3001` en `.env` y actualiza `AUTH_URL`.

## Arquitectura

```
┌─────────────────────────────────────────┐
│  MacBook M1 (siempre encendido)         │
│                                         │
│  ┌─────────────┐    ┌────────────────┐  │
│  │ Docker      │    │ Node.js        │  │
│  │ Postgres    │◄───│ Next.js :3000  │  │
│  │ Redis       │    │ ./storage/     │  │
│  └─────────────┘    └────────────────┘  │
│         ▲                  ▲            │
└─────────┼──────────────────┼────────────┘
          │                  │
     iPhone/iPad         localhost
     (misma WiFi)        Safari
```

## Desarrollo vs producción

| | Desarrollo | Producción Mac |
|---|------------|----------------|
| Comando | `npm run dev` | `./scripts/prod/start.sh` |
| Compose | `docker-compose.local.yml` | `docker-compose.prod.yml` |
| Registro | abierto | `ALLOW_REGISTRATION=false` |
| Build | hot reload | `next build` + `next start` |
