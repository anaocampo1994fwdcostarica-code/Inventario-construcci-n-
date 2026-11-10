# Etapa 22A — Auditoría de autenticación

Este documento conserva el resultado histórico de la auditoría. La migración
de autenticación quedó versionada en el repositorio; el estado de cada base debe
comprobarse individualmente con `npx prisma migrate status`.

## Roles y permisos

| Rol | Perfil | Permisos |
|---|---|---|
| `ADMINISTRADOR` | Administrador | Catálogos, usuarios, movimientos, compras, recepciones y alertas |
| `ENCARGADO_BODEGA` | Empleado | Inventario, compras y recepciones autorizadas |
| `SUPERVISOR_OBRA` | Empleado | Operaciones autorizadas de inventario y compras |
| `CONSULTA` | Solo lectura | Consultas; no puede escribir |

La autorización se aplica en `backend/src/middlewares/auth.js`.

## Seguridad

- Contraseñas con Argon2id.
- Sesiones opacas con tokens hash.
- Cookies HttpOnly y token CSRF para mutaciones.
- Sesiones expiradas, revocadas o inactivas rechazadas.
- No se exponen `passwordHash` ni tokens.

## Inicialización y demostración

El repositorio incluye `backend/scripts/init-admin.js` para el primer
administrador y `backend/scripts/seed.js` para poblar una base aislada de
demostración. Ambos requieren credenciales locales y nunca usan contraseñas
predeterminadas. El seed exige `SEED_DATABASE_NAME` y `SEED_ADMIN_PASSWORD`.

## Validaciones históricas

- Prisma Validate: exitoso.
- Pruebas backend: 49 exitosas y 1 omitida preexistente.
- Integraciones de inventario, recepciones y autenticación: reportadas como exitosas en la etapa correspondiente.
- Frontend lint y build: reportados como exitosos.

La prueba real de concurrencia permanece como pendiente documentado y el límite
de intentos de login es local al proceso.
