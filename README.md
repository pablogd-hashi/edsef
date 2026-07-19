# Memoria — Diarios digitales familiares

Aplicación web privada para crear, conservar y exportar diarios anuales de tus hijos. Diseñada para preservación a largo plazo con formatos abiertos y exportación completa.

## Características (MVP en desarrollo)

- Múltiples hijos con años de vida independientes
- Editor por secciones (hitos, historias, timeline, carta al futuro)
- Fotos y videos con almacenamiento S3 compatible
- Exportación PDF, HTML offline, JSON y ZIP
- Backups con checksums SHA-256
- Salud del archivo e integridad de datos
- Docker Compose para desarrollo local

## Stack

- **Frontend/Backend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Base de datos:** PostgreSQL + Prisma
- **Auth:** Auth.js (next-auth v5)
- **Storage:** MinIO / S3 compatible
- **Cola:** BullMQ + Redis
- **Editor:** Tiptap
- **Tests:** Vitest + Playwright

## Inicio rápido

### Requisitos

- Node.js 22+
- Docker y Docker Compose

### 1. Clonar e instalar

```bash
git clone <repo>
cd memoria
npm install
cp .env.example .env
```

### 2. Levantar servicios

```bash
docker compose up -d postgres redis minio minio-init
```

### 3. Base de datos

```bash
npx prisma migrate dev
npx prisma db seed
```

### 4. Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

### Credenciales demo

| Campo | Valor |
|-------|-------|
| Email | `demo@memoria.app` |
| Contraseña | `demo1234` |

Incluye a **Bianca** con su **Año 1** de ejemplo (Ámsterdam, Diemen, Valencia).

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run test` | Tests unitarios (Vitest) |
| `npm run test:e2e` | Tests E2E (Playwright) |
| `npm run worker` | Worker de procesamiento |
| `npm run db:seed` | Datos de ejemplo |
| `npm run db:studio` | Prisma Studio |

## Estructura del proyecto

```
├── docs/                  # Arquitectura, wireframes, plan, ADRs
├── prisma/                # Esquema y seed
├── src/
│   ├── app/               # Rutas Next.js (App Router)
│   ├── components/        # Componentes UI
│   ├── lib/
│   │   ├── auth/          # Auth.js
│   │   ├── db/            # Prisma client
│   │   ├── services/      # Lógica de negocio
│   │   ├── storage/       # S3, checksums
│   │   └── validators/    # Esquemas Zod
│   ├── workers/           # BullMQ workers
│   └── types/             # Tipos TypeScript
├── tests/
│   ├── unit/
│   └── e2e/
└── docker-compose.yml
```

## Documentación

- [Arquitectura](docs/architecture.md)
- [Modelo de datos](docs/data-model.md)
- [Wireframes](docs/wireframes.md)
- [Plan de implementación](docs/implementation-plan.md)
- [ADRs](docs/adr/)

## Exportación y portabilidad

Cada exportación ZIP incluye:

- `data/yearbook.json` — datos completos (schema v1.0)
- `html/index.html` — vista offline sin backend
- `pdf/yearbook.pdf` — libro imprimible A4
- `media/originals/` — archivos originales
- `manifest.json` — checksums SHA-256
- `README.md` — instrucciones de uso

## Plan de fases

| Fase | Estado | Contenido |
|------|--------|-----------|
| 0 | ✅ | Scaffold, docs, esquema, seed |
| 1 | 🔜 | Auth completa + dashboard |
| 2 | 🔜 | CRUD hijos y años |
| 3 | 🔜 | Editor Tiptap |
| 4 | 🔜 | Media upload + procesamiento |
| 5 | 🔜 | Hitos y timeline |
| 6 | 🔜 | Vista previa |
| 7 | 🔜 | Exportación PDF/HTML/ZIP |
| 8 | 🔜 | Backups y restauración |
| 9 | 🔜 | Acceso para hijos |
| 10 | 🔜 | Importación asistida |
| 11 | 🔜 | Hardening producción |

## Licencia

Privado — uso familiar.
