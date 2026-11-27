# Manual de Acceso para Evaluación Docente — EmpleaPerú

## 1. Acceso desde Cualquier Dispositivo
- **URL Pública HTTPS:** *(se completará al finalizar el despliegue en Vercel)*
- **Compatibilidad:** Navegador web moderno en PC, laptop, tablet o celular (Chrome, Edge, Safari, Firefox), sin instalar programas ni mantener el equipo del estudiante encendido.

## 2. Recorrido Sugerido de Evaluación (10 minutos)
1. **Sitio Público (`/` y `/empleos`):**
   - Probar búsqueda autocompletada, filtros por departamento/modalidad/salario PEN y vista lista + detalle.
   - Revisar `/empresas`, `/practicas`, `/salarios`, `/mapa` y `/ferias`.
2. **Flujo Postulante (`/login` → `/postulante`):**
   - Revisar perfil, completitud, recomendaciones por compatibilidad explicable (40/25/15/10/10).
   - Probar `/postulante/cv` (subida privada PDF/DOCX, Analizador CV 0–100 y Generador CV ATS con exportación PDF).
   - Revisar `/postulante/postulaciones` (Timeline de Transparencia), `/postulante/entrevistas`, `/postulante/evaluaciones`, `/postulante/carrera` y el widget flotante **EmpleaBot**.
3. **Flujo Empresa & ATS (`/login` → `/empresa`):**
   - Publicar/pausar una vacante en `/empresa/vacantes`.
   - Mover candidatos en el tablero Kanban en `/empresa/ats`, agregar notas, programar entrevista y exportar CSV.
   - Probar la simulación explícita de planes en `/empresa/planes`.
4. **Flujo Administrador (`/login` → `/admin`):**
   - Verificar estadísticas reales desde PostgreSQL, verificación manual de empresas, denuncias, reseñas y auditoría.

*Todos los usuarios, empresas, vacantes y pagos de demostración son estrictamente ficticios.*
