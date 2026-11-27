# Matriz de Riesgos — EmpleaPerú

| ID | Riesgo | Impacto | Probabilidad | Mitigación Implementada |
| :--- | :--- | :--- | :--- | :--- |
| R-01 | Acceso no autorizado (IDOR) a CVs privados de otros candidatos/empresas | Alto | Media | CVs guardados fuera de `public/` con UUID; `GET /api/resumes/[id]` verifica propiedad o postulación activa a empresa del reclutador. |
| R-02 | Fuga de datos privados en caché PWA | Alto | Baja | `public/sw.js` excluye explícitamente `/api/*`, `/postulante/*`, `/empresa/*`, `/admin/*`, `/mensajes` y `/notificaciones`. |
| R-03 | Sesgo algorítmico o rechazo automático injusto | Alto | Baja | Motor de compatibilidad 100% heurístico, ponderado y explicable; nunca usa atributos protegidos ni cambia estados automáticamente. |
| R-04 | Vacantes fraudulentas solicitando pagos previos | Alto | Media | Reglas heurísticas en `antifraud.ts` + botón de denuncia + cola de revisión humana en `/admin`. |
| R-05 | Dependencia de mapas/servicios externos en demo sin Internet | Medio | Media | Mapa de Perú renderizado en vector SVG offline-safe con coordenadas reales + sin API keys pagas obligatorias. |
| R-06 | Pérdida de base de datos local SQLite | Medio | Baja | Scripts `scripts/backup.mjs` y `scripts/restore.mjs` con verificación SHA-256 y protección contra sobrescritura accidental. |
| R-07 | PDF escaneado sin texto extraíble | Bajo | Media | `cv-analyzer.ts` detecta texto insuficiente e informa claramente sin inventar contenido. |
