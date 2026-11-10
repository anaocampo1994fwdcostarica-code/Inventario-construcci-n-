# Autenticación y autorización

La autenticación usa Argon2id y sesiones opacas almacenadas como hashes SHA-256
en `Sesion`. El token se entrega mediante cookie `HttpOnly`; las mutaciones
requieren también el token CSRF correspondiente.

La migración `20261109210000_autenticacion_sesiones` está versionada en el
repositorio. Su aplicación debe comprobarse por base con:

```powershell
npx prisma migrate status
```

## Roles

- `ADMINISTRADOR`: administración completa.
- `ENCARGADO_BODEGA`: inventario, recepciones y órdenes, sin administrar usuarios.
- `SUPERVISOR_OBRA`: operaciones autorizadas de inventario y compras.
- `CONSULTA`: consultas de lectura; no registra movimientos, compras ni recepciones.

## Endpoints

- Públicos: `GET /api/health` y `POST /api/auth/login`.
- Sesión: `GET /api/auth/me` y `POST /api/auth/logout`.
- El resto requiere sesión válida; las mutaciones requieren CSRF.

## Inicialización y seed

`backend/scripts/init-admin.js` crea el primer administrador únicamente mediante
un procedimiento local autorizado y con contraseña introducida de forma segura.
`backend/scripts/seed.js` sirve para bases aisladas de demostración: requiere
`SEED_ADMIN_PASSWORD`, genera el hash con Argon2id, usa IDs deterministas y no
acepta contraseñas predeterminadas. El seed rechaza la base de desarrollo salvo
una confirmación explícita.

Nunca se guardan contraseñas, hashes, tokens ni URLs completas en el repositorio.

## Consideraciones

El límite de intentos de login está en memoria del proceso. Para múltiples
instancias debe trasladarse a un almacén compartido. En producción se requiere
HTTPS, cookies `Secure` y un origen frontend explícito.
