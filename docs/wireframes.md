# Wireframes textuales

## 1. Login / Registro

```
┌────────────────────────────────────────────────────────┐
│                    [Logo] Memoria                       │
│                                                         │
│              Conserva los años de tus hijos             │
│                                                         │
│         ┌─────────────────────────────────┐            │
│         │  Email                          │            │
│         └─────────────────────────────────┘            │
│         ┌─────────────────────────────────┐            │
│         │  Contraseña                     │            │
│         └─────────────────────────────────┘            │
│                                                         │
│              [ Iniciar sesión ]                         │
│                                                         │
│         ¿Primera vez?  Crear cuenta                     │
└────────────────────────────────────────────────────────┘
```

## 2. Dashboard — Mis hijos

```
┌──────────────────────────────────────────────────────────────┐
│ Memoria          [Salud archivo] [Exportar] [⚙]  Juan P. ▾  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Mis hijos                              [ + Añadir hijo ]   │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  [foto]         │  │  [foto]         │                   │
│  │  Bianca         │  │  (vacío)        │                   │
│  │  1 año creado   │  │  Añade otro     │                   │
│  │  Última edición │  │  hijo           │                   │
│  │  hace 2 días    │  │                 │                   │
│  └─────────────────┘  └─────────────────┘                   │
│                                                              │
│  Acciones rápidas                                            │
│  [ Continuar Año 1 de Bianca ]  [ Crear backup ]           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 3. Perfil del hijo — Lista de años

```
┌──────────────────────────────────────────────────────────────┐
│ ← Mis hijos    Bianca                    [Editar] [Archivar] │
├──────────────────────────────────────────────────────────────┤
│  [foto grande]                                               │
│  Bianca · Nacida 15 mar 2024 · Ámsterdam                    │
│  Tema: ● #C4A77D                                             │
│                                                              │
│  Años de vida                          [ + Nuevo año ]       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Año 1 · 0-12 meses          BORRADOR    [Abrir] [⋯] │   │
│  │ Portada lista · 12 hitos · 48 fotos                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ (plantilla vacía para Año 2)                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 4. Editor de año — Vista general

```
┌──────────────────────────────────────────────────────────────┐
│ ← Bianca   Año 1                    [Vista previa] [Publicar]│
├──────────────┬───────────────────────────────────────────────┤
│ Secciones    │  Portada                                      │
│              │  ─────────────────────────────────────────    │
│ ≡ Portada    │  Título: El primer año de Bianca              │
│ ≡ Resumen    │  [ Cambiar foto de portada ]                  │
│ ≡ Hitos      │                                               │
│ ≡ Historias  │  Guardado automático · hace 3 s               │
│ ≡ Videos     │                                               │
│ ≡ Música     │                                               │
│ ≡ Notas      │                                               │
│ ≡ Timeline   │                                               │
│ ≡ Carta      │                                               │
│ ≡ Archivos   │                                               │
│              │                                               │
│ [Ocultar]    │                                               │
├──────────────┴───────────────────────────────────────────────┤
│ Plantilla: Editorial ▾    [Duplicar año anterior] [Exportar] │
└──────────────────────────────────────────────────────────────┘
```

## 5. Sección Hitos

```
┌──────────────────────────────────────────────────────────────┐
│ Hitos                                    [ + Añadir hito ]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ 6 meses ─────────────────────────────────────────────┐  │
│  │ Primera comida: banana y palta                        │  │
│  │ [img] [img]                                           │  │
│  │ #alimentación                              [Editar]   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ 8 meses ─────────────────────────────────────────────┐  │
│  │ Primer vuelo a Valencia                               │  │
│  │ [video thumb]                                         │  │
│  │ #viaje #avión                              [Editar]   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 6. Editor de historia (Tiptap)

```
┌──────────────────────────────────────────────────────────────┐
│ El día que naciste                              [Guardado ✓] │
├──────────────────────────────────────────────────────────────┤
│  B  I  H1  H2  •  "  ─  🖼  📎                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  # El día que naciste                                        │
│                                                              │
│  Era una mañana de marzo en Ámsterdam. El cielo estaba       │
│  gris pero dentro del hospital todo brillaba...              │
│                                                              │
│  ┌────────────────────────────────────────┐                  │
│  │         [foto: primeros momentos]      │                  │
│  └────────────────────────────────────────┘                  │
│                                                              │
│  > "Bienvenida al mundo, pequeña."                           │
│                                                              │
│  (columna única, ancho máximo ~720px, tipografía serif)      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 7. Timeline mensual

```
┌──────────────────────────────────────────────────────────────┐
│ Línea temporal 2024                                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ENE ──●── Primer mes en casa                               │
│          Vivíamos en Diemen                                  │
│                                                              │
│  MAR ──●── Nacimiento                                        │
│          Ámsterdam                                           │
│                                                              │
│  JUN ──●── Primera playa                                     │
│          Valencia                                            │
│          [foto] [foto] [foto]                                │
│                                                              │
│  ...                                                         │
│                                                              │
│  DIC ──●── Fin del primer año                               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 8. Vista previa (modo lectura)

```
┌──────────────────────────────────────────────────────────────┐
│                    [ Vista previa — Año 1 ]                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│              ┌─────────────────────────┐                     │
│              │                         │                     │
│              │    [FOTO PORTADA]       │                     │
│              │                         │                     │
│              │   El primer año de      │                     │
│              │        Bianca           │                     │
│              │      2024 · Año 1       │                     │
│              └─────────────────────────┘                     │
│                                                              │
│  ─── Resumen del año ───────────────────────────────────   │
│  Lugar: Diemen, Países Bajos                                 │
│  Viajes: Valencia, playa...                                  │
│                                                              │
│  ─── Hitos destacados ──────────────────────────────────   │
│  [cards en 2 columnas en desktop]                            │
│                                                              │
│  ─── Historia principal ────────────────────────────────   │
│  (columna única, texto largo)                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 9. Exportación

```
┌──────────────────────────────────────────────────────────────┐
│ Exportar — Año 1 de Bianca                                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Formato                                                     │
│  (●) ZIP completo (recomendado)                              │
│  ( ) Solo PDF                                                │
│  ( ) Solo HTML offline                                       │
│  ( ) Solo JSON                                               │
│                                                              │
│  Incluir                                                     │
│  [✓] Fotos originales  [✓] Videos  [✓] PDF  [✓] README      │
│  [ ] Códigos QR para videos                                  │
│                                                              │
│  [ Iniciar exportación ]                                     │
│                                                              │
│  Historial                                                   │
│  ✓ ZIP · 1.2 GB · 15 mar 2026 · [Descargar]               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 10. Salud del archivo

```
┌──────────────────────────────────────────────────────────────┐
│ Salud del archivo                                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Estado general:  ● Saludable                                │
│                                                              │
│  Último backup      10 mar 2026                              │
│  Última exportación 15 mar 2026                              │
│  Archivos totales   156                                      │
│  Espacio usado      2.4 GB                                   │
│  Sin checksum       0                                        │
│  Archivos faltantes 0                                        │
│                                                              │
│  [ Crear backup ahora ]  [ Verificar integridad ]            │
│                                                              │
│  Estrategia 3-2-1                                            │
│  ✓ Copia en servidor                                         │
│  ✓ Copia secundaria S3                                       │
│  ○ Copia offline (descarga ZIP)                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 11. Flujo guiado (onboarding)

```
Paso 1/12  Crear hijo  →  Paso 2  Primer año  →  ...  →  Exportar

┌──────────────────────────────────────────────────────────────┐
│ ●───●───○───○───○───○───○───○───○───○───○───○               │
│                                                              │
│  Cuéntanos sobre tu hijo/a                                   │
│                                                              │
│  Nombre completo  [ Bianca                    ]              │
│  Apodo            [                           ]              │
│  Fecha nacimiento [ 15/03/2024                ]              │
│  Foto de perfil   [ Subir foto ]                             │
│  Color tema       [ #C4A77D ]                                │
│                                                              │
│                              [ Atrás ]  [ Siguiente ]        │
└──────────────────────────────────────────────────────────────┘
```

## 12. Importación asistida

```
┌──────────────────────────────────────────────────────────────┐
│ Importar año desde PDF o JSON                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [ Arrastra un PDF o JSON aquí ]                             │
│                                                              │
│  Secciones detectadas (revisar manualmente):                 │
│  [✓] Resumen del año     [ Editar texto ]                    │
│  [✓] Hitos (8)           [ Revisar ]                         │
│  [ ] Videos              [ Asociar manualmente ]             │
│  [✓] Cronología          [ Revisar ]                         │
│                                                              │
│  [ Crear año editable ]                                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```
