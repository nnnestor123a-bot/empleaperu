# Documentación del Despliegue en Producción — EmpleaPerú

## 1. Arquitectura Cloud (Planes Gratuitos Académicos)
- **Código fuente:** GitHub (repositorio privado).
- **Alojamiento Web & HTTPS:** Vercel Hobby (despliegue automático desde rama `main`, certificado TLS/HTTPS automático, región `gru1` São Paulo para baja latencia hacia Perú).
- **Base de datos relacional:** Supabase PostgreSQL (plan Free, Pooler en puerto `6543` para funciones serverless + conexión directa en puerto `5432` para migraciones Prisma).
- **Almacenamiento privado de CVs:** Supabase Storage (bucket privado `resumes`, acceso exclusivo desde el servidor mediante `SUPABASE_SERVICE_ROLE_KEY`, jamás expuesto públicamente).
- **Versión local preservada:** Se mantiene intacto el esquema `prisma/schema.sqlite.prisma`, la base local `prisma/dev.db`, `INICIAR_PROYECTO.bat` y el respaldo completo `backups/EmpleaPeru_LOCAL_SQLITE_BACKUP.zip`.

## 2. Variables de Entorno de Producción (Vercel)
| Variable | Uso | Confidencialidad |
| :--- | :--- | :--- |
| `DATABASE_URL` | URI PostgreSQL Pooler (`?pgbouncer=true&connection_limit=1`) | Secreto servidor |
| `DIRECT_URL` | URI PostgreSQL directa (`:5432`) para Prisma | Secreto servidor |
| `AUTH_SECRET` | Secreto aleatorio ≥ 64 caracteres para firma JWT HS256 | Secreto servidor |
| `SUPABASE_URL` | URL del proyecto Supabase (`https://<ref>.supabase.co`) | Servidor |
| `SUPABASE_SERVICE_ROLE_KEY` | Llave de servicio para leer/escribir el bucket privado `resumes` | Secreto servidor |
| `SUPABASE_STORAGE_BUCKET` | `resumes` (bucket privado) | Servidor |
| `NEXT_PUBLIC_APP_URL` | URL pública HTTPS definitiva de Vercel | Pública |
| `NEXT_PUBLIC_SHOW_DEMO_HELPER` | `false` (oculta botones/claves demo en `/login`) | Pública |
| `ALLOW_DEV_RESET_TOKEN` | `false` (impide exponer tokens de recuperación en API) | Servidor |

## 3. Costos de Mantenimiento (Uso Académico)
| Servicio | Plan | Costo Mensual | Límites Principales (referenciales) |
| :--- | :--- | :--- | :--- |
| GitHub | Free (repo privado) | **$0 USD** | Repositorios privados ilimitados |
| Vercel | Hobby | **$0 USD** | 100 GB transferencia, HTTPS automático, subdominio `.vercel.app` |
| Supabase | Free | **$0 USD** | 500 MB PostgreSQL, 1 GB Storage (pausa tras 7 días sin tráfico; se reactiva en 1 clic) |
| **Total** | — | **$0 USD / mes** | *Sin contratación de servicios pagados* |

## 4. Procedimiento para Actualizar la Página
1. Realiza los cambios localmente en tu copia de `EmpleaPeru`.
2. Ejecuta pruebas antes de subir:
   ```powershell
   npm run typecheck
   npm run lint
   npm run test
   ```
3. Si modificaste `prisma/schema.prisma`, aplica el esquema a Supabase:
   ```powershell
   npx prisma db push
   ```
4. Sube tus cambios a GitHub:
   ```powershell
   git add -A
   git commit -m "chore: descripcion del cambio"
   git push origin main
   ```
5. Vercel detectará el `push` en `main`, ejecutará `npm run build` (`prisma generate && next build`) y actualizará la URL pública automáticamente en ~1–2 minutos sin tiempo de inactividad.
