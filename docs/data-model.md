# Modelo de datos

## Diagrama entidad-relación (resumen)

```
Family ──┬── FamilyMember ── User
         ├── Child ──┬── Yearbook ──┬── Section
         │           │              ├── Story
         │           │              ├── Milestone
         │           │              ├── TimelineEntry
         │           │              ├── MusicEntry
         │           │              ├── ParentNote
         │           │              ├── FutureLetter
         │           │              └── Attachment
         │           └── MediaAsset ── MediaVariant
         ├── Person
         ├── Location
         ├── Tag
         ├── ExportJob
         ├── BackupJob
         ├── Invitation
         └── AuditLog
```

## Entidades principales

### User

Cuenta de autenticación (Auth.js + datos propios).

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| email | String | único |
| name | String? | |
| passwordHash | String? | credenciales locales |
| emailVerified | DateTime? | |

### Family

Unidad organizativa; una familia puede tener varios padres y varios hijos.

### FamilyMember

Relación User ↔ Family con rol (`OWNER`, `PARENT`, `CHILD`, `GUEST`).

### Child

| Campo | Tipo | Notas |
|-------|------|-------|
| fullName | String | |
| nickname | String? | |
| birthDate | DateTime | para cálculo de edad |
| profilePhotoId | String? | FK MediaAsset |
| themeColor | String | hex, ej. `#C4A77D` |
| titleFont | String? | plantilla tipográfica |
| description | String? | |
| status | Enum | ACTIVE, ARCHIVED |

### Yearbook

Un año de vida o período.

| Campo | Tipo | Notas |
|-------|------|-------|
| childId | UUID | FK |
| title | String | ej. "Año 1" |
| yearNumber | Int? | 1, 2, 3… |
| periodStart | DateTime? | |
| periodEnd | DateTime? | |
| ageLabel | String? | "0-12 meses" |
| template | Enum | EDITORIAL, TIMELINE, ALBUM |
| status | Enum | DRAFT, PUBLISHED |
| coverPhotoId | String? | |
| customCoverTitle | String? | |

### Section

Bloque configurable dentro de un año (portada, resumen, hitos, etc.).

| Campo | Tipo | Notas |
|-------|------|-------|
| type | Enum | COVER, SUMMARY, MILESTONES, STORIES, VIDEOS, MUSIC, PARENT_NOTES, TIMELINE, FUTURE_LETTER, ATTACHMENTS |
| order | Int | reordenamiento manual |
| visible | Boolean | ocultar sin borrar |
| content | Json? | datos estructurados del resumen |

### Story

Historia larga con contenido Tiptap (JSON).

### Milestone

Hito con edad/fecha, descripción, media asociada.

### TimelineEntry

Entrada mensual o por fecha en la línea temporal.

| Campo | Tipo | Notas |
|-------|------|-------|
| month | Int? | 1-12 |
| eventDate | DateTime | |
| ageAtEvent | String? | calculado |
| title | String | |
| description | String? | |

### MediaAsset

Archivo central con metadatos y trazabilidad.

| Campo | Tipo | Notas |
|-------|------|-------|
| type | Enum | IMAGE, VIDEO, AUDIO, DOCUMENT |
| originalFilename | String | |
| mimeType | String | |
| size | BigInt | bytes |
| width / height | Int? | imágenes |
| duration | Float? | videos, segundos |
| storageKey | String | path en S3 |
| checksum | String? | SHA-256 |
| capturedAt | DateTime? | EXIF o manual |
| processingStatus | Enum | PENDING, PROCESSING, READY, FAILED |

### MediaVariant

Versiones derivadas del original.

| Variant | Uso |
|---------|-----|
| ORIGINAL | archivo subido |
| WEB | optimizado para web |
| THUMBNAIL | miniatura |

### MusicEntry

Canción del año con enlace opcional Spotify/YouTube.

### ParentNote

Nota de mamá o papá con autor y fecha.

### FutureLetter

Carta al futuro con opción de ocultar hasta edad.

| Campo | Tipo | Notas |
|-------|------|-------|
| content | Text | |
| signature | String? | |
| hiddenUntilAge | Int? | null = visible siempre |

### ExportJob / BackupJob

Trabajos asíncronos con estado, progreso y URL de resultado.

### Invitation

Invitación por email con rol y fecha de activación opcional.

### AuditLog

Registro de acciones sensibles (login, export, delete, access grant).

## Índices recomendados

- `Child(familyId, status)`
- `Yearbook(childId, status)`
- `TimelineEntry(yearbookId, month)`
- `MediaAsset(childId, type, processingStatus)`
- `AuditLog(familyId, createdAt)`

## Soft delete

Entidades con `deletedAt`: Child, Yearbook, Story, Milestone, TimelineEntry, MediaAsset.

## Cálculo de edad

```typescript
function calculateAge(birthDate: Date, atDate: Date): { years: number; months: number; label: string }
```

Se almacena `ageLabel` en hitos y timeline para consistencia histórica aunque cambie la lógica.
