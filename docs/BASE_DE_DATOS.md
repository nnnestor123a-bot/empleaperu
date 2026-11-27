# Base de Datos — EmpleaPerú

## 1. Motor y Portabilidad
- **Motor local:** SQLite (`file:./dev.db`) gestionado mediante Prisma 6.6.
- **Migración futura a PostgreSQL:** Los tipos usados (`String`, `Int`, `Float`, `Boolean`, `DateTime`, índices compuestos y llaves únicas) son estándar y portables a PostgreSQL sin reescribir la lógica de negocio.

## 2. Resumen de Entidades Principales (35 tablas)
- **Identidad y Seguridad:** `User`, `Session`, `PasswordResetToken`, `AuditLog`.
- **Postulantes:** `CandidateProfile`, `WorkExperience`, `Education`, `Certification`, `Skill`, `CandidateSkill`, `Resume`, `ResumeVersion`, `PortfolioItem`, `CareerGoal`, `Favorite`.
- **Empresas y Vacantes:** `Company`, `CompanyMember`, `JobCategory`, `Job`, `JobSkill`, `CompanyReview`.
- **Postulación y ATS:** `Application` (único `[jobId, candidateId]`), `ApplicationHistory`, `Interview`, `Evaluation`.
- **Comunicación:** `Conversation`, `Message`, `Notification`, `ContactMessage`.
- **Monetización Simulada:** `Plan`, `Subscription`, `PaymentSimulation`.
- **Empleabilidad y Moderación:** `Assessment`, `AssessmentAttempt`, `JobFair`, `JobFairCompany`, `JobFairRegistration`, `Report`.

## 3. Semilla Idempotente (`prisma/seed.ts`)
- 1 administrador, 10 empresas peruanas con RUCs de formato válido, 20 postulantes, 50 vacantes (incluyendo remotas, regionales y prácticas), 100 postulaciones con historial y compatibilidad, entrevistas, conversaciones, 9 evaluaciones técnicas, 3 ferias laborales, 3 planes y reseñas aprobadas.
