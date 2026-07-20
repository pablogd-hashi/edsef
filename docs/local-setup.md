# Memoria — modo local (sin MinIO)

Servicios mínimos para correr en casa: PostgreSQL + Redis + la app con almacenamiento en disco.

```bash
cp .env.example .env
docker compose -f docker-compose.local.yml up -d
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Credenciales demo: `demo@memoria.app` / `demo1234`

## Almacenamiento

Las fotos y videos se guardan en `./storage/` (configurable con `STORAGE_PATH`).
No se usa S3/MinIO en este modo.

## Exportación para Bianca

1. Entra al año → **Exportar** → elige **ZIP completo**
2. El ZIP contiene:
   - `html/index.html` — abre esto en el navegador (offline)
   - `html/assets/images/` — fotos referenciadas por nombre
   - `html/assets/videos/` — videos reproducibles con `<video>`
   - `pdf/yearbook.pdf` — versión imprimible (sin videos embebidos)
   - `data/yearbook.json` — datos en formato abierto
   - `manifest.json` — checksums para verificar integridad

3. Copia el ZIP a un USB. Bianca abre `html/index.html` y ve todo renderizado.

## Seguridad local

Tras crear tu cuenta, pon en `.env`:

```
ALLOW_REGISTRATION=false
```

Esto bloquea el registro público; solo login con usuarios existentes.
