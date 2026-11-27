# Plan de Pruebas — EmpleaPerú

## 1. Niveles de Prueba
1. **Análisis Estático y Compilación:**
   - `npm run typecheck` (`tsc --noEmit`)
   - `npm run lint` (`next lint`)
   - `npm run build` (`next build`)
2. **Pruebas Unitarias y de Reglas de Dominio (`vitest`):**
   - Validación matemática de formato RUC peruano.
   - Motor explicable de compatibilidad (ponderaciones 40/25/15/10/10 y datos faltantes).
   - Motor antifraude explicable (pagos previos, enlaces sospechosos vs vacante formal).
   - Analizador local de CV (estructura ATS y advertencia de PDF escaneado).
   - Simulador de entrevistas y cálculo geográfico Haversine.
3. **Pruebas de Integridad y Respaldo:**
   - Idempotencia de `npm run db:seed`.
   - `npm run backup` y `node scripts/restore.mjs <backup> --isolated` con verificación SHA-256.
4. **Pruebas Funcionales End-to-End en Navegador (`http://127.0.0.1:3000`):**
   - Navegación pública (`/`, `/empleos`, `/empresas`, `/practicas`, `/salarios`, `/mapa`, `/ferias`).
   - Autenticación y flujo con 3 roles (`postulante@empleaperu.local`, `empresa@empleaperu.local`, `admin@empleaperu.local`).
   - Postulación, ATS Kanban, EmpleaBot y verificación responsive.
