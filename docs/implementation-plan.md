# Plan de implementación por fases

## MVP vs futuro

### Incluido en MVP

- Autenticación (email/contraseña)
- Múltiples hijos y años
- Editor por secciones con Tiptap
- Hitos y timeline mensual
- Fotos y videos (upload + reproducción)
- Vista previa
- Export PDF, HTML, JSON, ZIP
- Backups manuales
- Example seed (generic placeholder only — removed; register first)
- Docker Compose local
- Tests básicos (Vitest + Playwright)

### Fuera del MVP (preparado, no implementado)

- IA para cartas
- Reconocimiento facial
- Transcripción de video
- Resúmenes automáticos
- App móvil nativa
- Impresión bajo demanda
- Colaboración familiar avanzada
- Backup programado automático (estructura lista)
- Importación perfecta desde PDF

---

## Fase 0 — Fundamentos (esta entrega)

**Objetivo:** Repositorio listo para desarrollo.

- [x] Documentación de arquitectura, modelo, wireframes
- [x] Scaffold Next.js + TypeScript + Tailwind
- [x] Esquema Prisma completo
- [x] Docker Compose (Postgres, Redis, MinIO)
- [x] Estructura de carpetas y servicios (stubs)
- [x] Configuración Auth.js
- [x] ADRs iniciales
- [x] Empty seed (no personal demo data)
- [x] README y `.env.example`

**Criterio de done:** `docker compose up` + `npm run dev` arranca sin errores.

---

## Fase 1 — Autenticación y familia

**Objetivo:** Usuario puede registrarse y ver dashboard vacío.

- Login, registro, logout
- Creación automática de Family + FamilyMember (OWNER)
- Middleware de protección de rutas
- Dashboard con estado vacío
- Tests: registro y login E2E

**Dependencias:** Fase 0

---

## Fase 2 — Gestión de hijos y años

**Objetivo:** CRUD completo de hijos y yearbooks.

- ChildrenService implementado
- YearbookService implementado
- UI: lista hijos, perfil hijo, lista años
- Flujo guiado pasos 1-3 (crear hijo, año, plantilla)
- Cálculo automático de edad
- Duplicar estructura año anterior
- Tests unitarios de servicios

**Dependencias:** Fase 1

---

## Fase 3 — Editor de secciones

**Objetivo:** Contenido editable por sección.

- Section CRUD con orden y visibilidad
- Tiptap para historias y resumen
- Plantillas: Editorial, Timeline, Álbum
- Autoguardado de borradores
- UI editor con sidebar de secciones
- Tests: serialización contenido Tiptap

**Dependencias:** Fase 2

---

## Fase 4 — Media (fotos y videos)

**Objetivo:** Upload, procesamiento y galería.

- MinIO/S3 presigned URLs
- MediaService: upload, checksum, variantes
- Worker Sharp (thumbnails, web)
- Worker FFmpeg (transcode opcional)
- UI: drag & drop, progreso, galería
- Asociación media ↔ hitos/timeline
- Tests: checksum, validación MIME

**Dependencias:** Fase 2, Redis

---

## Fase 5 — Hitos y timeline

**Objetivo:** Línea temporal completa.

- MilestoneService + TimelineService
- UI hitos con edad calculada
- Vista timeline mensual
- Etiquetas y ubicaciones
- Tests: cálculo de edad

**Dependencias:** Fase 3, Fase 4

---

## Fase 6 — Vista previa y publicación

**Objetivo:** Modo lectura editorial.

- Renderizado por plantilla
- Estado borrador vs publicado
- Flujo guiado pasos 9-11
- Responsive móvil
- Tests E2E: preview

**Dependencias:** Fase 5

---

## Fase 7 — Exportación

**Objetivo:** PDF, HTML, JSON, ZIP offline.

- ExportService + jobs BullMQ
- Plantilla HTML imprimible A4
- PDF con Playwright
- ZIP con manifest + README
- HTML 100% offline
- UI exportación con historial
- Tests: integridad ZIP, manifest checksums

**Dependencias:** Fase 6

---

## Fase 8 — Backups y salud del archivo

**Objetivo:** Preservación y verificación.

- BackupService manual
- Pantalla Salud del archivo
- Verificación checksums
- Restauración desde ZIP/JSON
- Export a bucket secundario
- Tests: restore round-trip

**Dependencias:** Fase 7

---

## Fase 9 — Acceso futuro (hijos)

**Objetivo:** Roles e invitaciones.

- AccessService
- Invitaciones por email
- Rol CHILD con scope por hijo
- Enlaces privados con token
- Carta al futuro con `hiddenUntilAge`
- Tests: autorización por recurso

**Dependencias:** Fase 1

---

## Fase 10 — Importación asistida

**Objetivo:** Migrar contenido existente.

- Upload PDF/JSON
- Detección básica de secciones
- UI revisión manual
- Crear Yearbook editable
- Documentación de migración

**Dependencias:** Fase 7

---

## Fase 11 — Hardening y documentación final

**Objetivo:** Producción-ready.

- Rate limiting, CSP, audit logs
- Cobertura de tests > 70% servicios críticos
- Guía de despliegue
- Guía de migración de proveedor
- Performance: lazy load imágenes

**Dependencias:** Todas las anteriores

---

## Orden de prioridad para criterios de aceptación

| # | Criterio | Fase |
|---|----------|------|
| 1 | Crear dos hijos | 2 |
| 2 | Varios años por hijo | 2 |
| 3 | Subir fotos y videos | 4 |
| 4 | Historia larga | 3 |
| 5 | Hitos | 5 |
| 6 | Eventos mensuales | 5 |
| 7 | Previsualizar año | 6 |
| 8 | Export PDF | 7 |
| 9 | Export HTML offline | 7 |
| 10 | ZIP completo | 7 |
| 11 | Restaurar backup | 8 |
| 12 | Acceso lectura hijo | 9 |
| 13 | Docker Compose local | 0 |
