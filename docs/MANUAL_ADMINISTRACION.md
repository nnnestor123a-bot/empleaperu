# Manual de Administración — EmpleaPerú

## 1. Acceso al Panel Administrativo
1. Ingresa en `<URL_PUBLICA>/login` con la cuenta de administrador asignada.
2. Accede a `/admin` (protegido exclusivamente para rol `ADMIN`).

## 2. Operación Diaria
- **Analítica BD:** Revisa KPIs reales (usuarios, empresas verificadas, vacantes publicadas, tasa de contratación) y gráficos derivados de PostgreSQL. Puedes descargar todas las postulaciones con **Exportar postulaciones CSV**.
- **Verificación manual de empresas:** En la pestaña `Empresas`, revisa el RUC (validado en formato local), sector y descripción, y haz clic en **Verificar** o **Rechazar**. La empresa recibe una notificación automática.
- **Gestión de usuarios:** En `Usuarios`, puedes suspender o reactivar cuentas (el sistema impide auto-suspender tu propia cuenta de administrador).
- **Antifraude y moderación:** En `Vacantes y Antifraude`, revisa ofertas con puntaje de riesgo ≥ 25 para pausar o publicar; en `Denuncias y Reseñas`, resuelve reportes ciudadanos y aprueba/rechaza valoraciones empresariales.
- **Auditoría y contacto:** Consulta `Auditoría y Contacto` para revisar acciones críticas (sin secretos) y mensajes enviados desde `/contacto`.

## 3. Respaldo y Mantenimiento
- **En Supabase:** Realiza respaldos desde *Database > Backups* o mediante `pg_dump` usando `DIRECT_URL`.
- **En entorno local:** Ejecuta `npm run backup` (genera manifest SHA-256) y valida restauraciones con `node scripts/restore.mjs backups\<carpeta> --isolated`.
- **Monitoreo rápido:** Consulta `GET <URL_PUBLICA>/api/health` para comprobar estado de la base de datos y backend de almacenamiento (`SUPABASE_STORAGE`).
