# Memoria — Diarios digitales familiares

Aplicación web privada para crear, conservar y exportar diarios anuales de tus hijos. Diseñada para preservación a largo plazo con formatos abiertos y exportación completa.

## Producción en MacBook (M1+)

Para correr en tu Mac como servidor familiar (laptop siempre encendida):

```bash
chmod +x scripts/prod/*.sh
./scripts/prod/setup-mac.sh --seed
./scripts/prod/start.sh
```

Guía completa: **[docs/production-mac.md](docs/production-mac.md)**

## Desarrollo local

```bash
cp .env.example .env
docker compose -f docker-compose.local.yml up -d
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Guía: [docs/local-setup.md](docs/local-setup.md)

## Características

- Múltiples hijos con años de vida independientes
- Editor por secciones (hitos, historias, timeline, carta al futuro)
- Fotos y videos con almacenamiento local en disco
- Edición inline para mamá/papá (OWNER/PARENT)
- Exportación PDF, HTML offline, JSON y ZIP
- Docker Compose para Postgres + Redis

## Stack

- **Frontend/Backend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Base de datos:** PostgreSQL + Prisma
- **Auth:** Auth.js (next-auth v5)
- **Storage:** filesystem local (`./storage`)
- **Tests:** Vitest + Playwright

### Credenciales demo

| Campo | Valor |
|-------|-------|
| Email | `demo@memoria.app` |
| Contraseña | `demo1234` |

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run prod:setup` | Setup inicial Mac producción |
| `npm run prod:start` | Arrancar en producción |
| `npm run prod:backup` | Backup DB + fotos |
| `npm run prod:update` | Actualizar tras git pull |
| `npm run test` | Tests unitarios |

## Documentación

- [Producción MacBook](docs/production-mac.md)
- [Setup local](docs/local-setup.md)
- [Arquitectura](docs/architecture.md)
- [Modelo de datos](docs/data-model.md)

## Licencia

Privado — uso familiar.
