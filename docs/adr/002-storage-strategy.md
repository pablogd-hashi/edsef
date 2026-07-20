# ADR 002: Estrategia de almacenamiento

## Estado

Aceptado

## Contexto

Fotos y videos deben conservarse en original, con variantes para web, sin URLs públicas permanentes.

## Decisión

1. Almacenar originales siempre en S3 bajo key estructurada
2. Generar variantes WEB y THUMBNAIL de forma asíncrona
3. Servir archivos solo mediante URLs firmadas con expiración
4. Registrar SHA-256 en `MediaAsset.checksum`
5. Nunca exponer bucket públicamente

## Estructura de keys

```
{families}/{familyId}/children/{childId}/assets/{assetId}/original.{ext}
{families}/{familyId}/children/{childId}/assets/{assetId}/web.{ext}
{families}/{familyId}/children/{childId}/assets/{assetId}/thumb.{ext}
```

## Consecuencias

- Requiere worker para procesamiento
- Export ZIP copia desde storage usando keys del manifest
- Migración a otro proveedor = copiar bucket + actualizar config
