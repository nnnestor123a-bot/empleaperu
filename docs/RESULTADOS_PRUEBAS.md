# Resultados de Pruebas — EmpleaPerú

Fecha de ejecución: 2026-11-26 (entorno Windows local, Node `v24.16.0`, npm `11.13.0`, Git `2.54.0.windows.1`).

## 1. Análisis Estático, Compilación y Pruebas Automatizadas

| Verificación | Comando Ejecutado | Resultado | Detalle |
| :--- | :--- | :--- | :--- |
| TypeScript estricto | `npm run typecheck` (`tsc --noEmit`) | **PASS** | 0 errores de tipado en toda la aplicación |
| ESLint | `npm run lint` (`next lint`) | **PASS** | 0 errores (4 warnings menores de `react-hooks/exhaustive-deps`) |
| Pruebas Unitarias e Integración | `npm run test` (`vitest run`) | **PASS** | **2 archivos, 13/13 pruebas aprobadas** (`tests/core.test.ts` + `tests/db-integration.test.ts`) |
| Seed Idempotente | `npm run db:seed` (ejecutado 2 veces) | **PASS** | 1ra ejecución sembró 1 admin, 10 empresas, 20 postulantes, 50 vacantes, 100 postulaciones, 9 evaluaciones, 3 ferias, 3 planes; 2da ejecución detectó datos existentes sin duplicar |
| Build de Producción | `npm run build` (`next build`) | **PASS** | **57/57 rutas** compiladas y optimizadas sin errores |
| Respaldo y Restauración Aislada | `npm run backup` + `node scripts/restore.mjs <backup> --isolated` | **PASS** | Integridad SHA-256 verificada (`d6f46672b2029bd81d77634e9c700ab2cac948345c9218dc3aa24b9c917d2220`) sin afectar `prisma/dev.db` |

## 2. Verificación End-to-End en Navegador (`http://localhost:3000`)

| Flujo Probado | Resultado | Evidencia Verificada |
| :--- | :--- | :--- |
| Inicio público (`/`) | **PASS** | HTTP 200; KPIs reales en BD (`50` vacantes, `10` empresas, `20` postulantes, `100` postulaciones), categorías, destacadas, últimas ofertas y empresas verificadas |
| Buscador split-view (`/empleos`) | **PASS** | Lista izquierda (50 vacantes paginadas) + panel derecho interactivo con actualización en vivo al seleccionar otra vacante |
| Salarios PEN (`/salarios`) y Mapa (`/mapa`) | **PASS** | Gráficos Recharts derivados de BD (`S/ 4,999` promedio, `S/ 5,000` mediana, `n=50`) y mapa vectorial SVG de Perú offline-first con pines por departamento |
| Flujo Postulante + EmpleaBot | **PASS** | Login demo (`postulante@empleaperu.local`), `/postulante` (85% completitud + recomendaciones 100%/92%/90%/80%), `/postulante/postulaciones` (timeline), `/postulante/cv` y respuesta interactiva de EmpleaBot |
| Flujo Empresa + ATS Kanban | **PASS** | Login demo (`empresa@empleaperu.local`), `/empresa` (`8/100` vacantes, `14` postulaciones) y `/empresa/ats` con tablero Kanban de 7 columnas y enlace `/api/ats/export` |
| Flujo Administrador (`/admin`) | **PASS** | Login demo (`admin@empleaperu.local`), KPIs reales (`31` usuarios, `8/10` empresas verificadas, `15%` contratación), 3 gráficos BD y 6 pestañas de gestión |
| Errores de consola y red | **PASS** | **0 errores de consola** y **0 respuestas HTTP >= 400** en todo el recorrido |

## 3. Ajustes Visuales Aplicados Tras Revisión en Navegador
- Rotación de etiquetas X en el gráfico de salarios por departamento (`/salarios`).
- Ajuste de silueta SVG y posición de etiquetas en `/mapa` para evitar superposición de pines.
- Estado vacío explícito para `Mensajes de contacto (0)` en `/admin`.
- Ajuste responsive del input de archivo en `/postulante/cv`.
