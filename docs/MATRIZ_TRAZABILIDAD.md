# Matriz de Trazabilidad — EmpleaPerú

| Requerimiento | Módulo / Ruta | API / Servicio | Evidencia de Prueba |
| :--- | :--- | :--- | :--- |
| RF-01 Sitio público | `/`, `/empleos`, `/empleos/[slug]`, `/empresas`, `/practicas` | `/api/jobs`, `/api/companies`, `/api/meta` | Build + verificación en navegador |
| RF-02 Auth y RBAC | `/login`, `/registro`, `/recuperar-password` | `/api/auth/*`, `src/lib/auth.ts` | Pruebas API + navegación autenticada |
| RF-03 Perfil postulante | `/postulante`, `/postulante/perfil`, `/postulante/favoritos` | `/api/profile`, `/api/favorites` | CRUD verificado + export JSON |
| RF-04 CV privado + ATS | `/postulante/cv` | `/api/resumes`, `/api/resumes/[id]`, `cv-analyzer.ts` | Vitest (`core.test.ts`) + storage privado |
| RF-05 Empresas y vacantes | `/empresa`, `/empresa/perfil`, `/empresa/vacantes` | `/api/empresa/jobs`, `/api/jobs`, `validators.ts` | Vitest RUC + límites de plan |
| RF-06/07 Postulación y ATS | `/postulante/postulaciones`, `/empresa/ats` | `/api/applications`, `/api/applications/[id]`, `/api/ats/export` | Kanban + historial + CSV |
| RF-08 Compatibilidad | `/empleos`, `/postulante`, `/empresa/ats` | `src/lib/compatibility.ts` | Vitest 40/25/15/10/10 |
| RF-09 Mensajes y alertas | `/mensajes`, `/notificaciones` | `/api/messages`, `/api/notifications` | Aislamiento por participante |
| RF-10 Monetización simulada | `/servicios`, `/empresa/planes` | `/api/subscriptions` | Comprobantes `SIMULATED_PAID` |
| RF-11 Admin y Antifraude | `/admin` | `/api/admin`, `/api/reports`, `antifraud.ts` | Vitest antifraude + gráficos BD |
| RF-12 Empleabilidad | `/salarios`, `/mapa`, `/ferias`, `/postulante/entrevistas`, `/postulante/carrera`, `/postulante/evaluaciones`, `/postulante/portafolio`, EmpleaBot | `/api/salaries`, `/api/fairs`, `/api/interviews/practice`, `/api/assessments`, `/api/career`, `/api/empleabot` | Vitest + verificación navegador |
| RNF-03 Respaldo y PWA | `/offline`, `public/sw.js`, `scripts/backup.mjs`, `scripts/restore.mjs` | `npm run backup` / `restore` | Backup + restauración aislada SHA-256 |
