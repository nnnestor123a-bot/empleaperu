# Plan de Sprints — EmpleaPerú

## Definición de Terminado (DoD)
1. Código TypeScript tipado (`tsc --noEmit` sin errores).
2. Reglas de autorización validadas en servidor y persistencia verificada en SQLite.
3. Sin botones muertos, páginas vacías ni gráficos con cifras inventadas.
4. Pruebas automatizadas y compilación de producción (`npm run build`) exitosas.
5. Avances y evidencias registrados en `PROGRESO.md`.

## Sprints Ejecutados
- **Sprint 1 (Fases 1–3):** Infraestructura Next.js/Prisma/SQLite, esquema de 35 modelos, semilla idempotente, autenticación segura RBAC y portal público comercial (`/` , `/empleos`, `/empresas`, `/practicas`).
- **Sprint 2 (Fases 4–7):** Portal postulante completo (perfil, CV privado, analizador/generador PDF, favoritos, postulaciones con timeline), portal empresa (vacantes, ATS Kanban, entrevistas, CSV) y mensajería/notificaciones.
- **Sprint 3 (Fases 8–10):** Compatibilidad explicable, simulador de entrevistas, EmpleaBot local, ruta de carrera, planes simulados, administración con analítica y antifraude, salarios PEN, mapa offline-safe, reputación, evaluaciones (9 áreas), portafolio público, ferias y PWA segura.
- **Sprint 4 (Fases 11–12):** Auditoría de seguridad, backup/restauración probada en copia aislada, pruebas unitarias, build de producción, verificación en navegador real y entrega de documentación + `INICIAR_PROYECTO.bat`.
