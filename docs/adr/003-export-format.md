# ADR 003: Formato de exportación

## Estado

Aceptado

## Contexto

El contenido debe ser accesible en 20-30 años sin depender de la plataforma.

## Decisión

Cada exportación ZIP incluye:

```
export-{child}-{year}-{date}/
├── README.md           # Instrucciones de uso
├── manifest.json       # Checksums SHA-256 de cada archivo
├── data/
│   └── yearbook.json   # Datos completos en JSON estándar
├── html/
│   ├── index.html      # Vista offline autocontenida
│   ├── styles.css
│   └── assets/         # Referencias relativas
├── pdf/
│   └── yearbook.pdf
├── media/
│   ├── originals/      # Archivos originales
│   └── thumbnails/
```

- JSON usa esquema versionado (`schemaVersion: "1.0"`)
- HTML no requiere JavaScript para lectura básica
- PDF generado desde misma plantilla HTML

## Consecuencias

- ZIPs pueden ser grandes (aceptable para archivo familiar)
- manifest permite verificar integridad años después
- Importación futura puede leer `yearbook.json` directamente
