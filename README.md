# EmpleaPerú — Plataforma Peruana de Empleo, ATS y Crecimiento Profesional

Aplicación web full-stack local desarrollada con **Next.js 15, React 19, TypeScript, Tailwind CSS, Prisma y SQLite** (compatible con migración futura a PostgreSQL).

## Inicio rápido en Windows
1. Haz doble clic en **`INICIAR_PROYECTO.bat`** (o ejecuta `npm run dev` tras `npm run setup`).
2. Abre **`http://localhost:3000`** (`http://127.0.0.1:3000`).

## Cuentas ficticias de demostración local
Contraseña común: **`Emplea2026!`**
- **Postulante:** `postulante@empleaperu.local`
- **Empresa / Reclutador:** `empresa@empleaperu.local`
- **Administrador:** `admin@empleaperu.local`

## Módulos implementados
- **Sitio público comercial:** Inicio con buscador autocompletado, `/empleos` (vista lista + detalle estilo Computrabajo/Bumeran), `/empresas`, `/practicas`, `/salarios`, `/mapa` (offline-safe), `/ferias`, `/servicios`, `/nosotros`, `/contacto`, `/ayuda`, `/privacidad`, `/terminos`, `/portafolio/[slug]`.
- **Portal Postulante (`/postulante`):** Perfil + completitud + exportación Ley 29733, CV privado fuera de `public/`, Analizador CV ATS (0–100), Generador CV ATS con exportación PDF, Postulaciones con Timeline de Transparencia, Favoritos, Simulador de Entrevistas, Ruta de Carrera, Evaluaciones Técnicas (9 áreas) y Portafolio Público.
- **Portal Empresa & ATS (`/empresa`):** Validación local de formato RUC, Gestión de vacantes con chequeo antifraude, ATS Kanban con notas/evaluaciones/entrevistas/CV privado/exportación CSV y Planes con simulación local explícita.
- **Comunicación y Administración:** `/mensajes`, `/notificaciones`, widget flotante **EmpleaBot** (reglas locales) y `/admin` con analítica derivada de BD, verificación manual de empresas, moderación y auditoría.
- **Operación:** PWA con caché estrictamente pública (`public/sw.js`), scripts de respaldo/restauración con SHA-256 (`npm run backup` / `scripts/restore.mjs`) y documentación completa en `docs/`.

## Comandos principales
```powershell
npm run dev        # Servidor en http://127.0.0.1:3000
npm run test       # Pruebas unitarias Vitest
npm run typecheck  # Verificación estricta TypeScript
npm run lint       # ESLint
npm run build      # Compilación de producción
npm run backup     # Respaldo con manifest SHA-256
```
