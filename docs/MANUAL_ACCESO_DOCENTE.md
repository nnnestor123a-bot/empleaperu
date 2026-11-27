# Manual de Acceso para Evaluación Docente — EmpleaPerú

## 1. Acceso Público Directo (sin instalar programas ni iniciar sesión en Vercel)
- **URL Pública HTTPS definitiva:** [https://empleaperu.vercel.app](https://empleaperu.vercel.app)
- **Repositorio público:** [https://github.com/nnnestor123a-bot/empleaperu](https://github.com/nnnestor123a-bot/empleaperu)
- **Disponibilidad:** 24/7 en la nube (Vercel + Supabase PostgreSQL + Supabase Storage privado), sin depender de que la computadora del estudiante permanezca encendida.

## 2. Credenciales Ficticias de Demostración (`/login`)
| Rol | Correo | Contraseña | Ruta principal |
| :--- | :--- | :--- | :--- |
| **Postulante** | `postulante@empleaperu.local` | `EmpleaPeru2026!` | `/postulante` |
| **Empresa / Reclutador** | `empresa@empleaperu.local` | `EmpleaPeru2026!` | `/empresa` y `/empresa/ats` |
| **Administrador** | `admin@empleaperu.local` | `EmpleaPeru2026!` | `/admin` |

## 3. Recorrido Sugerido de Evaluación (10 minutos)
1. **Sitio Público (`/` y `/empleos`):** Probar búsqueda autocompletada, filtros (ej. `React`, `Lima`, salario PEN, modalidad) y vista lista + detalle; revisar `/empresas`, `/practicas`, `/salarios`, `/mapa` y `/ferias`.
2. **Postulante (`/postulante`):** Revisar completitud (`85%`), recomendaciones por compatibilidad explicable (40/25/15/10/10), `/postulante/cv` (Analizador 0–100 + Generador PDF), `/postulante/postulaciones` (Timeline de Transparencia), `/postulante/entrevistas`, `/postulante/evaluaciones`, `/postulante/carrera` y **EmpleaBot**.
3. **Empresa & ATS (`/empresa`):** Gestionar vacantes en `/empresa/vacantes`, mover candidatos en el tablero Kanban en `/empresa/ats`, exportar CSV y probar planes simulados en `/empresa/planes`.
4. **Administración (`/admin`):** Revisar estadísticas en vivo desde PostgreSQL, verificación manual de empresas, denuncias, reseñas y auditoría; verificar que al cerrar sesión `/admin` redirige automáticamente a `/login`.
