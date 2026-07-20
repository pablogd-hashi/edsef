# Arquitectura técnica — Family Yearbook

## Visión general

Family Yearbook es una aplicación web privada para crear, conservar y exportar diarios digitales anuales de hijos. El diseño prioriza **portabilidad**, **preservación a largo plazo** y **propiedad de los datos** sobre funcionalidades propietarias.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Cliente (navegador)                              │
│  Next.js App Router · React · Tailwind · Tiptap                         │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │ HTTPS
┌──────────────────────────────────▼──────────────────────────────────────┐
│                    Next.js (monolito modular)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Pages/UI  │  │  API Routes │  │  Middleware │  │   Auth.js   │    │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘  └─────────────┘    │
│         │                │                                               │
│  ┌──────▼────────────────▼──────────────────────────────────────────┐ │
│  │                    Capa de servicios (dominio)                      │ │
│  │  ChildrenService · YearbookService · TimelineService · MediaService │ │
│  │  ExportService · BackupService · AccessService                      │ │
│  └──────┬─────────────────────────────────────────────────────────────┘ │
└─────────┼───────────────────────────────────────────────────────────────┘
          │
    ┌─────┴─────┬─────────────┬──────────────┐
    ▼           ▼             ▼              ▼
┌────────┐ ┌─────────┐ ┌───────────┐ ┌──────────────┐
│Postgres│ │  Redis  │ │ S3/MinIO  │ │ Worker proc  │
│ Prisma │ │ BullMQ  │ │  medios   │ │ FFmpeg/Sharp │
└────────┘ └─────────┘ └───────────┘ └──────────────┘
```

## Principios de diseño

| Principio | Implementación |
|-----------|----------------|
| Propiedad de datos | Exportación completa en JSON + ZIP con originales |
| Formatos abiertos | JPEG, PNG, MP4, PDF, HTML, JSON |
| Integridad | SHA-256 por archivo, manifest en backups |
| Privacidad | URLs firmadas, sin assets públicos permanentes |
| Portabilidad | HTML offline, README en cada exportación |
| Separación de capas | Lógica de negocio fuera de componentes React |

## Capas de la aplicación

### 1. Presentación (`src/app`, `src/components`)

- Rutas con App Router agrupadas por contexto: auth, dashboard, hijo, año, exportación.
- Componentes UI reutilizables sin lógica de negocio.
- Editor por bloques con Tiptap.
- Estados: loading, vacío, error en todas las vistas.

### 2. API (`src/app/api`)

- REST JSON con validación Zod.
- Autorización por recurso (familia → hijo → año).
- Rate limiting en uploads y exportaciones.
- CSRF en mutaciones sensibles.

### 3. Dominio (`src/lib/services`, `src/domain`)

Servicios con responsabilidad única:

| Servicio | Responsabilidad |
|----------|-----------------|
| `ChildrenService` | CRUD hijos, temas, archivado |
| `YearbookService` | Años, secciones, plantillas, duplicación |
| `TimelineService` | Entradas mensuales, edad calculada |
| `MediaService` | Upload, variantes, checksums, signed URLs |
| `ExportService` | PDF, HTML, JSON, ZIP |
| `BackupService` | Backup manual/programado, S3, manifest |
| `AccessService` | Roles, invitaciones, enlaces privados |

### 4. Persistencia (`prisma`)

- PostgreSQL como fuente de verdad relacional.
- Soft delete (`deletedAt`) en entidades principales.
- Auditoría en `AuditLog`.

### 5. Almacenamiento (`src/lib/storage`)

- S3 compatible (MinIO local, R2/S3 en producción).
- Estructura de keys: `{familyId}/{childId}/{yearbookId}/{assetId}/{variant}`.
- Variantes: `original`, `web`, `thumbnail`.

### 6. Procesamiento asíncrono (`src/workers`)

Cola BullMQ + Redis para:

- Generación de miniaturas (Sharp).
- Transcodificación de video (FFmpeg).
- Exportación PDF (Playwright).
- Empaquetado ZIP.
- Backups programados.

## Flujo de datos — subida de media

```
Usuario → API upload (presigned URL o multipart)
       → MediaService registra MediaAsset (status: pending)
       → Job en cola
       → Worker: checksum SHA-256, Sharp/FFmpeg
       → Actualiza MediaVariant + processingStatus: ready
       → AuditLog
```

## Flujo de exportación

```
Usuario solicita export ZIP
       → ExportJob creado (status: queued)
       → Worker:
           1. Serializa JSON del año
           2. Genera HTML estático (plantilla + assets embebidos/refs relativas)
           3. Renderiza PDF con Playwright
           4. Copia originales al ZIP
           5. Escribe manifest.json + README.md
       → ExportJob status: completed
       → URL firmada de descarga (expira)
```

## Estrategia de backup 3-2-1

1. **Copia principal**: base de datos + bucket S3 primario.
2. **Copia secundaria**: bucket S3 secundario (opcional, configuración).
3. **Copia offline**: export ZIP descargable por el usuario.

Cada backup incluye `manifest.json` con checksums para verificación.

## Seguridad

- Auth.js con sesiones en base de datos.
- Roles: `OWNER`, `PARENT`, `CHILD`, `GUEST`.
- Middleware de autorización por `familyId` / `childId`.
- CSP, HSTS, X-Frame-Options, noindex.
- Validación MIME y tamaño en uploads.
- Enlaces firmados con expiración para media y exportaciones.

## Despliegue local (Docker Compose)

| Servicio | Puerto | Función |
|----------|--------|---------|
| `app` | 3000 | Next.js |
| `worker` | — | Procesamiento BullMQ |
| `postgres` | 5432 | Base de datos |
| `redis` | 6379 | Cola |
| `minio` | 9000/9001 | Almacenamiento S3 |

## Riesgos identificados

| Riesgo | Mitigación |
|--------|------------|
| Pérdida de datos a largo plazo | Export ZIP + checksums + documentación de migración |
| Videos muy grandes | Límites configurables, transcodificación async |
| PDF con muchas fotos | Paginación, compresión, jobs en background |
| Dependencia de proveedor cloud | S3 API estándar, HTML/JSON portable |
| Acceso futuro de hijos | Roles + invitaciones + export por hijo |
| Corrupción de archivos | SHA-256 + pantalla Salud del archivo |

## Decisiones registradas

Ver `docs/adr/` para ADRs sobre stack, almacenamiento y formatos de exportación.
