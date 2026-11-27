# Matriz de KPI — EmpleaPerú

Todos los KPI del panel `/admin` y `/salarios` se derivan en tiempo real de consultas a la base de datos SQLite local:

| KPI | Fuente en BD | Propósito |
| :--- | :--- | :--- |
| Vacantes publicadas activas | `Job (status = PUBLISHED)` | Medir oferta laboral vigente |
| Empresas verificadas | `Company (verificationStatus = VERIFIED)` | Confiabilidad del ecosistema |
| Postulaciones totales y por etapa | `Application` agrupado por `status` | Monitoreo de embudo ATS |
| Tasa de contratación (%) | `SELECCIONADO / total Applications * 100` | Conversión efectiva |
| Distribución geográfica | `Job` agrupado por `department` | Cobertura nacional |
| Salario promedio, mediana y muestra (`n`) | `Job (salaryVisible = true)` en PEN | Transparencia salarial local |
| Alertas antifraude y denuncias abiertas | `Job (fraudRiskScore >= 25)`, `Report (status = OPEN)` | Seguridad preventiva |
