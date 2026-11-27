# Informe de Seguridad Pre-Producción — EmpleaPerú

## 1. Auditoría de Dependencias y Hardening Aplicado
- **Actualización de Next.js:** Se actualizó `next` y `eslint-config-next` desde `15.3.2` a la última versión parcheada de la rama `15.x` para mitigar vulnerabilidades conocidas reportadas por npm.
- **Secreto JWT obligatorio en producción (`src/lib/auth.ts`):** En `NODE_ENV=production`, la aplicación rechaza arrancar sesiones si `AUTH_SECRET` está ausente, tiene menos de 32 caracteres o contiene valores por defecto de desarrollo.
- **Deshabilitación de herramientas de desarrollo en producción:**
  - `POST /api/auth/password`: bloquea la devolución de `devResetToken` en producción (`ALLOW_DEV_RESET_TOKEN` debe ser `false`).
  - `/login`: oculta completamente el panel de autocompletado de cuentas demo cuando `NEXT_PUBLIC_SHOW_DEMO_HELPER !== "true"`.
- **Cabeceras HTTP de seguridad (`next.config.ts`):**
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`
  - `poweredByHeader: false` (oculta cabecera `X-Powered-By: Next.js`).

## 2. Control de Acceso (RBAC) y Aislamiento Anti-IDOR
- **Rutas protegidas en servidor:** `/postulante/*` (`CANDIDATE`/`ADMIN`), `/empresa/*` (`COMPANY`/`ADMIN`), `/admin/*` (`ADMIN`), además de validación `requireRole()` en cada Route Handler `/api/*`.
- **Protección contra auto-suspensión:** `PATCH /api/admin` impide que un administrador suspenda su propia cuenta activa.
- **Aislamiento entre empresas:** `canAccessCompany()` restringe lectura/edición de vacantes, tablero ATS y exportación CSV únicamente a empresas a las que pertenece el reclutador autenticado.
- **Protección de currículums y datos personales:**
  - En producción, los CVs PDF/DOCX se almacenan en un **bucket privado** de Supabase Storage (`resumes`) bajo nombres UUID aleatorios.
  - Solo el servidor descarga el archivo a través de `GET /api/resumes/[id]` previa validación de propietario, postulación activa a la empresa solicitante o rol `ADMIN`, devolviendo `Cache-Control: no-store, private`.
  - Validación de tamaño (máx. 5 MB), extensión y firma binaria real (`%PDF` / `PK`).
- **PWA segura (`public/sw.js`):** Jamás cachea `/api/*`, sesiones, CVs ni rutas privadas (`/postulante`, `/empresa`, `/admin`, `/mensajes`, `/notificaciones`).
- **Higiene de repositorio:** `.env`, `prisma/dev.db`, `storage/private/` y `backups/` están excluidos en `.gitignore`.
