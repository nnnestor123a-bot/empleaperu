# EmpleaPerú — especificación integral
## 1–8. Visión, objetivos y fundamentos
Plataforma peruana de empleo, reclutamiento y crecimiento profesional inspirada en Computrabajo, Bumeran, Indeed, LinkedIn Jobs y Glassdoor, con identidad original. Objetivos: sitio público responsive; autenticación y roles; gestión de vacantes; postulaciones y ATS; compatibilidad explicable; seguridad; estadísticas; validación integral. Actúa como equipo de arquitectura, UX, desarrollo, QA, seguridad y gestión. Stack propuesto: Next.js, React, TypeScript, Tailwind, shadcn/ui, Prisma, SQLite, Auth.js o alternativa segura, bcrypt, Zod, Recharts, Lucide, Node LTS y Git. Versiones compatibles, migración futura a PostgreSQL. Sin servicios pagados obligatorios. Identidad: azul #2563EB, azul oscuro #12336B, verde #16A34A, blanco, gris #F3F4F6, texto #111827, Inter o equivalente; modo claro/oscuro. Roles visitante, postulante, empresa/reclutador y administrador. Registro, login/logout, recuperación y cambio de contraseña, sesiones, rutas privadas, rate limiting, auditoría. Correo de desarrollo local claramente identificado.
## 9. Postulantes
Perfil con foto, nombres, contacto, departamento/provincia/distrito, profesión, descripción, experiencia, formación, certificaciones, habilidades técnicas y blandas, idiomas, disponibilidad, salario esperado, modalidad, CV PDF/DOCX, porcentaje de completitud, recomendaciones, favoritos, historial, notificaciones y privacidad. CRUD de datos propios.
## 10. Empresas
Razón social, RUC, nombre comercial, logo, sector, descripción, ubicación, web, contacto, tamaño, verificación manual, perfil público, reclutadores autorizados y dashboard. Validar formato RUC sin afirmar consulta SUNAT.
## 11. Empleos
Título, empresa, descripción, responsabilidades, requisitos, habilidades, experiencia, formación, ubicación peruana, salario PEN mínimo/máximo, modalidad, contrato, jornada, vacantes, beneficios, fechas y estado. Crear, editar, publicar, pausar, cerrar, archivar. Filtros por salario, ubicación, categoría, modalidad, experiencia y fecha; búsqueda y paginación.
## 12. Postulaciones
Estados enviada, revisión, preselección, entrevista, evaluación, seleccionado, no seleccionado, retirado. Historial, notificaciones, unicidad candidato/vacante, acceso propio.
## 13. ATS
Candidatos por vacante, CV privado, filtros, evaluaciones, notas internas, puntuaciones, entrevistas, calendario, Kanban, historial y CSV autorizado. Aislamiento entre empresas.
## 14. Compatibilidad
Motor local explicable: habilidades 40%, experiencia 25%, formación 15%, ubicación/modalidad 10%, salario 10%. Mostrar coincidencias, brechas y recomendaciones; documentar tratamiento de datos faltantes. No rechazo automático ni atributos protegidos. No llamarlo IA entrenada.
## 15–16. Mensajes y notificaciones
Conversaciones autorizadas, historial, no leídos, denuncias; alertas por postulación, estado, entrevista, mensaje, recomendación, vencimiento y verificación. Acceso exclusivo a participantes.
## 17. Monetización
Planes gratuito, profesional y empresarial con límites, estadísticas, destacados y multiusuario. Simulación explícita de suscripción/pago sin tarjetas reales; futura pasarela opcional. Publicidad y servicios de reclutamiento como opciones comerciales.
## 18–19. Administración y estadísticas
Usuarios, empresas, verificaciones, suspensiones, vacantes, denuncias, categorías, roles, suscripciones, auditoría y configuración. Indicadores derivados de BD: registros, postulaciones por mes, vacantes por categoría/estado, distribución geográfica, procesos, tasa de contratación y conversión. Filtros, paginación y exportación autorizada.
## 20. Modelo de datos
Users, Roles, CandidateProfiles, Companies, CompanyMembers, WorkExperiences, Education, Skills, CandidateSkills, Certifications, Resumes, JobCategories, Jobs, JobSkills, Applications, ApplicationHistory, Interviews, Evaluations, Favorites, Conversations, Messages, Notifications, Plans, Subscriptions, PaymentSimulations, Reports, AuditLogs, ContactMessages. Ampliar para módulos avanzados. Relaciones, índices, restricciones únicas, integridad, migraciones y diagrama ER.
## 21. Seguridad
OWASP: hash de contraseñas, RBAC en servidor, validación, SQLi, XSS, CSRF según arquitectura, cookies adecuadas, rate limits, sesiones, IDOR, aislamiento empresarial, archivos privados fuera de public, límites de tamaño y tipo real, nombres aleatorios, errores seguros, auditoría sin secretos. Considerar Ley peruana 29733 sin certificar cumplimiento. Consentimiento, minimización, exportación/eliminación de datos según reglas documentadas. No ejecutar documentos cargados.
## 22–30. Gestión, datos, ejecución y aceptación
Scrum y buenas prácticas PMI: backlog, historias, aceptación, sprints, EDT, cronograma, riesgos, KPI, trazabilidad, entregables, cambios, incidencias y definición de terminado. Seed idempotente: 1 administrador, 10 empresas, 20 candidatos, 50 vacantes, 100 postulaciones, mensajes, entrevistas, planes y alertas ficticios. Credenciales solo locales, documentadas. Pruebas unitarias, integración y E2E de flujos, permisos, persistencia, archivos y responsive. Generar scripts npm de setup, seed, dev, test, lint, typecheck y build; INICIAR_PROYECTO.bat y manual Windows. Bind 127.0.0.1, puerto 3000. No afirmar éxito sin ejecutar. Aceptación: web pública, roles, vacantes, búsqueda, postulaciones, ATS, administración, persistencia y pruebas críticas funcionales.
## 31. Página pública comercial
Inicio, empleos, empresas, nosotros, servicios, contacto, login, registro, publicar empleo, buscador cargo/empresa/ubicación con autocompletado, categorías, destacados, últimas ofertas, empresas destacadas, departamentos, remoto, prácticas, técnicos, beneficios, estadísticas de BD, FAQ, ayuda, privacidad, términos, footer. Navegación fija, responsive, teclado, estados vacíos/carga/error. Resultados con lista y detalle de vacante, filtros y favoritos. Diseño original, no copiar marcas ni código. Prioridad máxima para exposición docente.
## 32. Analizador CV
Extraer texto local PDF/DOCX; experiencia, educación, habilidades, certificaciones, palabras clave, estructura y faltantes. Puntuación orientativa 0–100 explicable y recomendaciones. Informar si un PDF escaneado no es legible; no inventar contenido.
## 33. Generador CV
Plantillas ATS, editor, vista previa, colores, tipografía, orden de secciones, importar perfil, versiones y exportación PDF.
## 34. Entrevistas
Banco local de preguntas técnicas, conductuales y situacionales por cargo, sector, nivel y dificultad. Respuestas de texto, ejemplos y feedback basado en criterios; integración IA opcional.
## 35. EmpleaBot
Asistente local basado en reglas y contenido estructurado para orientación, vacantes, perfil, entrevistas, habilidades, estados, FAQ y publicación empresarial. Adaptador opcional Ollama/API, desactivado por defecto.
## 36. Salarios
Promedio, mediana, rangos, tamaño de muestra y gráficos por profesión, departamento, experiencia, sector, modalidad y contrato. Usar salarios de BD; distinguir datos sintéticos, no afirmar representatividad nacional.
## 37. Mapa
Leaflet con fuente autorizada, marcadores, distrito, distancia aproximada, modalidad y detalle. Consentimiento de ubicación. Alternativa offline en lista; no depender de teselas externas para demo.
## 38. Carrera
Puesto objetivo, habilidades dominadas/faltantes, preparación, prioridades, ruta de aprendizaje, cursos y certificaciones con progreso. No inventar enlaces o certificaciones.
## 39. Antifraude
Reglas explicables para solicitudes de dinero, duplicados, enlaces sospechosos, empresas no verificadas, información insuficiente y denuncias. Revisión humana, alertas y consejos; no acusaciones automáticas.
## 40. Reputación
Valoraciones elegibles de ambiente, crecimiento, selección, comunicación y beneficios; moderación, privacidad, denuncias y prevención de duplicados.
## 41. Evaluaciones
Banco de programación, ciberseguridad, redes, electricidad, automatización, administración, ofimática, idiomas y lógica. Temporizador, alternativas, resultados, feedback y pruebas personalizadas empresariales. No criterio único de contratación.
## 42. Portafolio
Proyectos, certificaciones, fotos, documentos, enlaces, repositorios y experiencia; URL pública opcional con control de visibilidad.
## 43. Ferias
Eventos, empresas, agenda, inscripción, vacantes, alertas, enlaces externos e historial.
## 44. Prácticas
Estudiantes universitarios/técnicos, egresados, sin experiencia; filtros carrera, institución, ciclo, modalidad y ubicación.
## 45. Transparencia
Timeline de eventos autorizados: recibido, revisado, preselección, entrevista, evaluación y resultado; alertas y recomendaciones.
## 46. ATS avanzado
Kanban, comparación, filtros, indicadores, tiempo de selección, entrevistas, pruebas, reportes, equipos y recomendaciones explicables. Decisión humana.
## 47. PWA
Manifest, iconos, instalación, service worker, pantalla offline, caché solo pública; jamás cachear CV, sesiones ni datos privados.
## 48. Rendimiento
Lazy loading, imágenes optimizadas, paginación, índices, consultas eficientes, SEO público, accesibilidad WCAG 2.2 AA como objetivo. Medir y documentar resultados reales.
## 49. Respaldo
Scripts de backup y restauración de BD y archivos, integridad y registro. No sobrescribir sin aprobación; probar restauración en copia aislada.
## 50. Demo académica
Mostrar inicio, registro, login, publicación, búsqueda, CV, postulación, compatibilidad, ATS, entrevista, estadísticas y administración. Manual y cuentas ficticias.
## 51–52. Calidad y ejecución
Sin botones muertos, páginas vacías, gráficos arbitrarios ni funciones fingidas. Integrar todos los módulos incrementalmente. Revisar navegador, probar, corregir, documentar, commits locales. Priorizar sitio público y flujo esencial antes de ampliaciones. No afirmar equivalencia comercial con plataformas maduras. Reportar pendientes y bloqueos.
