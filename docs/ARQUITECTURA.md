# Arquitectura del Sistema — EmpleaPerú

## 1. Stack Tecnológico Fijado
- **Frontend & Backend Full-Stack:** Next.js 15.3 (App Router), React 19, TypeScript 5.8, Tailwind CSS 3.4, Lucide React, Recharts 2.15, jsPDF 3.0.
- **Persistencia:** Prisma ORM 6.6 + SQLite local (`prisma/dev.db`), esquema compatible con migración futura a PostgreSQL cambiando `provider` y `DATABASE_URL`.
- **Seguridad y Validación:** `bcryptjs` (hash contraseñas), `jose` (JWT HS256 en cookie `HttpOnly; SameSite=Lax` contrastado contra tabla `Session`), `zod` (esquemas de entrada), almacenamiento privado de CVs en `storage/private/resumes/`.
- **Extracción local de documentos:** `mammoth` para `.docx` y extractor de texto literal local para `.pdf` (sin ejecutar archivos).
- **Calidad:** Vitest 3.1, ESLint, TypeScript `tsc --noEmit`.

## 2. Capas Arquitectónicas
1. **Capa de Presentación (`src/app/**`, `src/components/**`):**
   - Rutas públicas SSR/CSR (`/` , `/empleos`, `/empresas`, `/practicas`, `/salarios`, `/mapa`, `/ferias`, `/servicios`, `/contacto`, `/ayuda`).
   - Portales privados protegidos en layout servidor (`src/app/postulante/layout.tsx`, `src/app/empresa/layout.tsx`, `src/app/admin/layout.tsx`).
2. **Capa de API REST (`src/app/api/**`):**
   - Controladores HTTP con validación Zod, `requireRole()`, aislamiento `canAccessCompany()`, rate limiting en memoria y registro en `AuditLog`.
3. **Capa de Dominio (`src/lib/**`):**
   - `compatibility.ts`, `antifraud.ts`, `cv-analyzer.ts`, `interview-bank.ts`, `empleabot.ts`, `career-paths.ts`, `validators.ts`, `auth.ts`, `audit.ts`.
4. **Capa de Datos (`prisma/schema.prisma`, `prisma/seed.ts`, `storage/private/`):**
   - 35 modelos relacionales con índices y restricciones de unicidad.
5. **Capa PWA y Operación (`public/sw.js`, `scripts/backup.mjs`, `scripts/restore.mjs`, `INICIAR_PROYECTO.bat`).**
