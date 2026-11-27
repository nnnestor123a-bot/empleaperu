# Progreso — EmpleaPerú

## Estado General
**Fases 1 a 12 completadas y verificadas** en entorno local Windows (`http://127.0.0.1:3000` / `http://localhost:3000`).

## Registro por Fases

### Fase 1 — Entorno, Inicialización, Arquitectura y Documentación
- Entorno verificado: Node `v24.16.0`, npm `11.13.0`, Git `2.54.0.windows.1`.
- Stack instalado con versiones compatibles fijadas en `package.json` y `package-lock.json` (Next.js 15.3.2, React 19, TypeScript 5.8, Tailwind 3.4, Prisma 6.6, SQLite, bcryptjs, jose, Zod, Recharts, Lucide, mammoth, jsPDF, Vitest).
- Repositorio Git local inicializado y 16 documentos técnicos creados en `docs/`.

### Fase 2 — Sitio Público Comercial
- Implementado inicio comercial (`/`), buscador split-view (`/empleos`), detalle SEO (`/empleos/[slug]`), directorio y perfil de empresas (`/empresas`, `/empresas/[id]`), hub de prácticas (`/practicas`), `/nosotros`, `/servicios`, `/contacto`, `/ayuda`, `/privacidad` y `/terminos`.

### Fase 3 — Base de Datos Prisma/SQLite, Seed y Autenticación RBAC
- Esquema de 35 modelos en `prisma/schema.prisma`, sincronizado en `prisma/dev.db`.
- Seed idempotente ejecutado y verificado dos veces: 1 admin, 10 empresas con RUC de formato válido, 20 postulantes, 50 vacantes, 100 postulaciones, entrevistas, mensajes, notificaciones, 9 evaluaciones, 3 ferias y 3 planes.
- Autenticación con hash `bcryptjs`, cookie `HttpOnly` HS256 validada en tabla `Session`, rate limiting, recuperación local documentada (`/recuperar-password`) y auditoría sin secretos.

### Fases 4 a 7 — Portales Postulante, Empresa, ATS Kanban y Comunicación
- **Postulante:** `/postulante`, `/postulante/perfil` (CRUD + exportación JSON Ley 29733), `/postulante/cv` (almacenamiento privado fuera de `public/` con control anti-IDOR), `/postulante/postulaciones` (Timeline de Transparencia), `/postulante/favoritos`.
- **Empresa & ATS:** `/empresa`, `/empresa/perfil` (validación local de formato RUC + equipo), `/empresa/vacantes` (CRUD + límites por plan + chequeo antifraude), `/empresa/ats` (Kanban 7 etapas, notas, evaluaciones, entrevistas, descarga privada de CV y exportación CSV).
- **Comunicación:** `/mensajes` (hilos autorizados) y `/notificaciones`.

### Fases 8 a 10 — Módulos Avanzados y Administración
- Compatibilidad heurística explicable (40/25/15/10/10), Analizador CV 0–100 y Generador CV ATS con PDF, Simulador de Entrevistas, EmpleaBot por reglas locales, Ruta de Carrera, Evaluaciones Técnicas (9 áreas), Portafolio Público (`/portafolio/[slug]`), Salarios PEN derivados de BD (`/salarios`), Mapa Perú offline-safe (`/mapa`), Ferias (`/ferias`), Planes con simulación explícita (`/empresa/planes`), Reputación moderada y Panel Admin (`/admin`) con analítica BD y antifraude.
- PWA configurada (`public/manifest.json`, `public/icon.svg`, `public/sw.js` excluyendo rutas privadas/APIs, `/offline`).

### Fases 11 y 12 — Seguridad, Respaldo, Pruebas, Build, Navegador y Lanzador
- `npm run typecheck`: **PASS** (0 errores).
- `npm run lint`: **PASS** (0 errores).
- `npm run test`: **PASS** (13/13 pruebas unitarias e integración SQLite).
- `npm run backup` + `node scripts/restore.mjs <backup> --isolated`: **PASS** (SHA-256 verificado).
- `npm run build`: **PASS** (57/57 rutas compiladas).
- Verificación E2E en navegador (`http://localhost:3000`) con los 3 roles: **6/6 pasos PASS**, 0 errores de consola y 0 errores HTTP.
- Creado lanzador `INICIAR_PROYECTO.bat` y manuales en `docs/MANUAL_INSTALACION.md` y `docs/MANUAL_USUARIO.md`.

## Bloqueos / Notas del Entorno
- Durante el entorno sandboxed de Windows, `npm install`, descarga del binario de Prisma y `next build` (error transitorio `EPERM` en `mkdir`) se ejecutaron en el host local manteniendo todo el repositorio y servidor confinados a `127.0.0.1:3000`.
- Validación RUC es estrictamente de formato matemático local (no consulta SUNAT). Pagos y correos de recuperación operan en modo simulación/desarrollo local claramente identificado.


### Fase 13 — Preparación y Endurecimiento para Producción Cloud (GitHub + Supabase + Vercel)
- **Respaldo previo completo:** Creados `backups/backup-2026-11-27T05-49-26-379Z` (SHA-256 verificado) y archivo completo `backups/EmpleaPeru_LOCAL_SQLITE_BACKUP.zip` (471 KB), preservando intacta la versión local.
- **Arquitectura dual de BD:** `prisma/schema.prisma` configurado para PostgreSQL (Supabase con `DATABASE_URL` + `DIRECT_URL` y `binaryTargets: ["native", "rhel-openssl-3.0.x"]`) y `prisma/schema.sqlite.prisma` preservado para ejecución local en Windows (`INICIAR_PROYECTO.bat`).
- **Almacenamiento protegido de CVs (`src/lib/storage.ts`):** Adaptador automático para Supabase Storage (bucket privado `resumes` vía `SUPABASE_SERVICE_ROLE_KEY` solo en servidor) con fallback a disco privado local.
- **Seguridad y auditoría pre-producción:** Actualización de Next.js a `^15.5.29` (parche CVE), `AUTH_SECRET` obligatorio ≥32 caracteres en producción, deshabilitación de `devResetToken` y panel de claves demo en `/login` para producción, HSTS + cabeceras OWASP en `next.config.ts`, prevención de auto-suspensión admin y endpoint `GET /api/health`.
- **Documentación de despliegue:** Creados `docs/DESPLIEGUE_PRODUCCION.md`, `docs/INFORME_SEGURIDAD_PRODUCCION.md`, `docs/MANUAL_ADMINISTRACION.md`, `docs/MANUAL_ACCESO_DOCENTE.md` y `vercel.json`.
- **Pendiente de autorización del usuario:** Conexión/autenticación en GitHub (repositorio privado), Supabase (PostgreSQL + Storage) y Vercel para completar la publicación HTTPS y las pruebas E2E en la URL pública.


### Fase 14 — Publicación en Producción HTTPS y Verificación E2E Pública (COMPLETADA)
- **GitHub:** Repositorio público sincronizado en `https://github.com/nnnestor123a-bot/empleaperu` (rama `main`, sin `.env` ni `.db`).
- **Supabase PostgreSQL:** Esquema de 35 tablas aplicado con `prisma db push` y datos demo sembrados (`31` usuarios, `10` empresas, `50` vacantes, `100` postulaciones, `9` evaluaciones, `3` ferias). Network Restrictions verificado abierto para Vercel.
- **Supabase Storage:** Bucket privado `resumes` creado y probado (acceso público bloqueado `400`, lectura servidor `200`).
- **Vercel Producción:** Proyecto `nestor3/empleaperu` desplegado con `vercel --prod` en **`https://empleaperu.vercel.app`**, 10 variables de entorno configuradas en Production/Preview/Development y **Deployment Protection desactivado**.
- **Verificación E2E en navegador sobre `https://empleaperu.vercel.app`:** **8/8 pruebas aprobadas** (sitio público, filtros PostgreSQL, módulos públicos, hardening `/login`, Postulante + EmpleaBot, Empresa + ATS Kanban, Admin y redirección RBAC sin sesión), **0 errores de consola** y **0 errores HTTP**.
