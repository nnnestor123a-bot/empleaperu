# EmpleaPerú — Plataforma Peruana de Empleo, ATS y Crecimiento Profesional

🌐 **Sitio Público en Producción (HTTPS):** [https://empleaperu.vercel.app](https://empleaperu.vercel.app)  
📦 **Repositorio GitHub:** [https://github.com/nnnestor123a-bot/empleaperu](https://github.com/nnnestor123a-bot/empleaperu)

Aplicación web full-stack de empleo, reclutamiento transparente (ATS Kanban), compatibilidad explicable y desarrollo profesional en el Perú, desplegada en **Vercel + Supabase PostgreSQL + Supabase Storage privado** (planes gratuitos académicos), manteniendo también soporte completo de ejecución local con SQLite.

---

## Acceso rápido para evaluación docente (sin instalar nada)

1. Abre directamente **[https://empleaperu.vercel.app](https://empleaperu.vercel.app)** desde cualquier navegador (PC, tablet o móvil) — todas las páginas públicas (`/`, `/empleos`, `/empresas`, `/practicas`, `/salarios`, `/mapa`, `/ferias`, `/servicios`, `/nosotros`, `/contacto`, `/ayuda`) son accesibles sin crear cuenta ni iniciar sesión.
2. Para probar los portales autenticados en `/login`, utiliza cualquiera de las **cuentas ficticias de demostración**:

| Rol | Correo de prueba | Contraseña de prueba | Panel |
| :--- | :--- | :--- | :--- |
| **Postulante** | `postulante@empleaperu.local` | `EmpleaPeru2026!` | `/postulante` |
| **Empresa / ATS** | `empresa@empleaperu.local` | `EmpleaPeru2026!` | `/empresa` y `/empresa/ats` |
| **Administrador** | `admin@empleaperu.local` | `EmpleaPeru2026!` | `/admin` |

*(Todos los datos, empresas, vacantes, postulaciones y planes son estrictamente ficticios para demostración académica).*

---

## Módulos principales
- **Sitio público comercial:** Buscador con autocompletado y estadísticas reales de PostgreSQL (`/`), buscador split-view lista + detalle (`/empleos`), empresas verificadas y reseñas moderadas (`/empresas`), hub de prácticas (`/practicas`), explorador de salarios PEN con gráficos (`/salarios`), mapa interactivo del Perú (`/mapa`) y ferias laborales (`/ferias`).
- **Portal Postulante (`/postulante`):** Perfil con completitud automática y exportación JSON (referencia Ley 29733), subida de CV privado en **Supabase Storage** con control anti-IDOR, **Analizador CV ATS (0–100)**, **Generador CV ATS con exportación PDF**, Timeline de Transparencia (`/postulante/postulaciones`), Simulador de Entrevistas, Ruta de Carrera, Evaluaciones Técnicas (9 áreas) y Portafolio Público.
- **Portal Empresa & ATS (`/empresa`):** Validación local de formato RUC, CRUD de vacantes con chequeo antifraude y límites por plan, **ATS Kanban de 7 columnas** con notas, evaluaciones, agenda de entrevistas, descarga de CV privado y exportación CSV, además de planes con simulación explícita.
- **Comunicación, EmpleaBot y Administración:** Mensajería autorizada (`/mensajes`), notificaciones (`/notificaciones`), asistente flotante **EmpleaBot** basado en reglas locales y panel `/admin` con analítica derivada de BD, verificación manual de empresas, moderación y auditoría sin secretos.

---

## Ejecución local en Windows (versión local SQLite preservada)
1. Haz doble clic en **`INICIAR_PROYECTO.bat`** (usa `prisma/schema.sqlite.prisma` y `prisma/dev.db`).
2. Abre `http://localhost:3000`.

## Documentación completa (`docs/`)
- Despliegue y actualización: [`docs/DESPLIEGUE_PRODUCCION.md`](docs/DESPLIEGUE_PRODUCCION.md)
- Seguridad pre-producción: [`docs/INFORME_SEGURIDAD_PRODUCCION.md`](docs/INFORME_SEGURIDAD_PRODUCCION.md)
- Acceso docente y administración: [`docs/MANUAL_ACCESO_DOCENTE.md`](docs/MANUAL_ACCESO_DOCENTE.md), [`docs/MANUAL_ADMINISTRACION.md`](docs/MANUAL_ADMINISTRACION.md)
- Pruebas verificadas: [`docs/RESULTADOS_PRUEBAS.md`](docs/RESULTADOS_PRUEBAS.md)
