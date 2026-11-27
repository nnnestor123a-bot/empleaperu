# Seguridad y Privacidad — EmpleaPerú

## 1. Controles OWASP Implementados
- **A01 Broken Access Control (RBAC e IDOR):**
  - Verificación de rol en servidor (`requireRole`) y layouts protegidos (`/postulante`, `/empresa`, `/admin`).
  - Aislamiento estricto entre empresas (`canAccessCompany`) al editar vacantes, consultar ATS o exportar CSV.
  - Descarga de CVs (`GET /api/resumes/[id]`) restringida exclusivamente al candidato dueño, empresa con postulación activa del candidato o administrador.
- **A02 Cryptographic Failures:**
  - Contraseñas hasheadas con `bcryptjs` (salt rounds 10).
  - Sesiones firmadas HS256 (`jose`) en cookie `HttpOnly; SameSite=Lax`, contrastadas contra hash SHA-256 en tabla `Session` (revocables en logout y cambio de clave).
- **A03 Injection / XSS:**
  - Consultas parametrizadas con Prisma ORM y validación estricta con Zod en todas las rutas críticas.
  - Sin uso de `dangerouslySetInnerHTML`.
- **A04 / A05 Seguridad de Archivos y Cabeceras:**
  - CVs privados guardados en `storage/private/resumes/` (fuera de `public/`) con nombres UUID aleatorios, límite 5 MB, validación de extensión + magic bytes (`%PDF` y `PK`) y sin ejecución de documentos.
  - Cabeceras HTTP: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`.
  - Rate limiting en login, registro, recuperación de contraseña y contacto.
  - Auditoría (`AuditLog`) con redacción automática de claves sensibles (`password`, `token`, `secret`).

## 2. Privacidad y Referencia Ley 29733 (Perú)
- Consentimiento explícito en registro (`consentAcceptedAt`).
- Controles de visibilidad para correo, teléfono y portafolio público.
- Portabilidad de datos propios en JSON (`GET /api/profile?export=true`).
- Service Worker PWA configurado para jamás cachear rutas privadas, APIs, sesiones ni CVs.
- *Nota:* Esta implementación adopta buenas prácticas alineadas a la Ley 29733 sin emitir certificación legal formal.
