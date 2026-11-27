# Cronograma y EDT — EmpleaPerú

*Nota metodológica:* Este cronograma refleja la Estructura de Desglose de Trabajo (EDT) real ejecutada en entorno local Windows. Las estimaciones de referencia académica no constituyen compromiso comercial externo.

## Estructura de Desglose de Trabajo (EDT)
1. **1.0 Gestión y Arquitectura**
   - 1.1 Inspección de entorno (Node 24, npm 11, Git 2.54)
   - 1.2 Definición de stack, esquema ER y variables de entorno
   - 1.3 Documentación integral en `docs/`
2. **2.0 Núcleo de Datos y Seguridad**
   - 2.1 Modelo relacional Prisma/SQLite (35 tablas)
   - 2.2 Seed idempotente (1 admin, 10 empresas, 20 postulantes, 50 vacantes, 100 postulaciones)
   - 2.3 Autenticación JWT+BD, RBAC, aislamiento empresarial, protección CV privado
3. **3.0 Sitio Público y Flujo de Contratación**
   - 3.1 Inicio comercial, buscador split-view, detalle de vacante, empresas y prácticas
   - 3.2 Portal postulante, perfil, postulaciones y timeline de transparencia
   - 3.3 Portal empresa, publicación de vacantes, ATS Kanban y mensajería
4. **4.0 Módulos Avanzados de Empleabilidad y Gestión**
   - 4.1 Compatibilidad explicable, Analizador/Generador CV, Entrevistas, EmpleaBot, Carrera
   - 4.2 Salarios PEN, Mapa Perú, Evaluaciones (9 áreas), Portafolio, Ferias, Planes simulados, Admin
5. **5.0 Verificación, Respaldo y Despliegue Local**
   - 5.1 Pruebas Vitest, TypeScript, ESLint, Build Next.js
   - 5.2 Pruebas de backup/restauración aislada y verificación visual en navegador en `127.0.0.1:3000`
   - 5.3 Lanzador `INICIAR_PROYECTO.bat` y manuales
