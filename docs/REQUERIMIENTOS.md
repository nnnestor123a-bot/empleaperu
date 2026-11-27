# Requerimientos — EmpleaPerú

## 1. Requerimientos Funcionales (RF)
- **RF-01 Sitio público comercial:** Inicio con buscador autocompletado, categorías, vacantes destacadas, últimas ofertas, empresas verificadas, departamentos, remoto, prácticas, salarios PEN, mapa, ferias, nosotros, servicios, contacto, ayuda/FAQ, privacidad y términos.
- **RF-02 Autenticación y roles (RBAC):** Registro, login/logout, recuperación y cambio de contraseña (modo local documentado), sesiones HTTP-only persistidas en BD, roles `CANDIDATE`, `COMPANY`, `ADMIN` y rate limiting.
- **RF-03 Portal Postulante:** Perfil con completitud automática, experiencia, formación, certificaciones, habilidades, preferencias, favoritos, privacidad y exportación JSON (Ley 29733).
- **RF-04 CV privado, Analizador y Generador ATS:** Subida de PDF/DOCX fuera de `public/`, validación magic-bytes, descarga con control anti-IDOR, análisis local 0–100 (con alerta de PDF escaneado) y editor de CV ATS con exportación a PDF.
- **RF-05 Empresas y Vacantes:** Perfil corporativo con validación local de formato RUC (sin afirmar consulta SUNAT), equipo de reclutadores, CRUD y estados de vacantes (`DRAFT`, `PUBLISHED`, `PAUSED`, `CLOSED`, `ARCHIVED`).
- **RF-06 Postulaciones y Transparencia:** Postulación única por `(jobId, candidateId)`, historial auditable, timeline visual de etapas y retiro voluntario.
- **RF-07 ATS Avanzado:** Tablero Kanban por etapas, filtro por vacante, notas internas, evaluaciones 1–5, agenda de entrevistas, descarga autorizada de CV privado y exportación CSV.
- **RF-08 Compatibilidad Explicable:** Fórmula determinista local (Habilidades 40%, Experiencia 25%, Formación 15%, Ubicación/Modalidad 10%, Salario 10%), manejo explícito de datos faltantes, cero atributos protegidos y sin rechazo automático.
- **RF-09 Mensajería y Notificaciones:** Hilos autorizados por participante y centro de alertas por postulación, estado, entrevista, mensaje y verificación.
- **RF-10 Monetización Simulada:** Planes `FREE`, `PRO`, `ENTERPRISE` con límites verificados en servidor y simulación explícita de suscripción/comprobante sin tarjetas reales.
- **RF-11 Administración, Analítica y Antifraude:** Verificación manual de empresas, suspensión de usuarios, moderación de vacantes/reseñas/denuncias, categorías, auditoría sin secretos y gráficos derivados de BD.
- **RF-12 Módulos de Empleabilidad:** Salarios PEN desde BD, Mapa interactivo offline-safe, Simulador de entrevistas, EmpleaBot por reglas locales, Ruta de carrera, Evaluaciones técnicas (9 áreas), Portafolio público controlable, Ferias laborales y Hub de Prácticas.

## 2. Requerimientos No Funcionales (RNF)
- **RNF-01 Seguridad (OWASP):** Hash bcryptjs, sesiones JWT+BD, validación Zod, aislamiento empresarial, CVs fuera de `public/`, cabeceras de seguridad y auditoría sin secretos.
- **RNF-02 Rendimiento y Accesibilidad:** Paginación, índices en SQLite, enfoque WCAG 2.2 AA (skip-link, foco visible, contraste, etiquetas ARIA), PWA con caché estrictamente pública.
- **RNF-03 Portabilidad y Respaldo:** SQLite local listo para migración a PostgreSQL, scripts de backup/restauración con SHA-256 y lanzador `INICIAR_PROYECTO.bat` en `127.0.0.1:3000`.
