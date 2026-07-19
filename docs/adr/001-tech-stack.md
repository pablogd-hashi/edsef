# ADR 001: Stack tecnológico

## Estado

Aceptado

## Contexto

Necesitamos una aplicación web full-stack con preservación a largo plazo, exportación rica y procesamiento de medios.

## Decisión

- **Frontend/Backend**: Next.js 16 App Router con TypeScript estricto
- **Base de datos**: PostgreSQL + Prisma ORM
- **Auth**: Auth.js (next-auth v5)
- **Cola**: BullMQ + Redis
- **Storage**: S3 compatible (MinIO en dev)
- **Editor**: Tiptap
- **Imágenes**: Sharp
- **Videos**: FFmpeg (worker)
- **PDF**: Playwright
- **Tests**: Vitest + Playwright

## Consecuencias

- Monolito modular facilita despliegue inicial
- Prisma acelera desarrollo y migraciones
- Dependencia de Redis para jobs async (aceptable para MVP)
- Playwright añade peso al worker pero produce PDFs fieles
