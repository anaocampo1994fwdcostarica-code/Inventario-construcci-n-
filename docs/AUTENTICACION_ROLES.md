# Autenticación y autorización

## Alcance

La autenticación usa contraseñas Argon2id y sesiones opacas almacenadas como hashes SHA-256 en la tabla `Sesion`. El token se entrega únicamente mediante cookie `HttpOnly`; las mutaciones requieren además el token CSRF de la cookie no `HttpOnly` en `X-CSRF-Token`.

La migración `20261109210000_autenticacion_sesiones` se aplicó solamente a `gestion_inventario_construccion_test`. La base de desarrollo no fue migrada.

## Roles

- `ADMINISTRADOR`: administración completa, incluidos usuarios y cambios de estado sensibles.
- `ENCARGADO_BODEGA`: operaciones de inventario, recepciones y órdenes; sin administración de usuarios.
- `SUPERVISOR_OBRA`: operaciones de inventario, recepciones y órdenes; sin administración de usuarios.
- `CONSULTA`: consultas de lectura; no puede registrar movimientos, compras ni recepciones.

Aunque los tres últimos roles pertenecen visualmente al perfil `EMPLEADO`, la autorización se evalúa por el rol real.

## Endpoints públicos y protegidos

- Público: `GET /api/health`, `POST /api/auth/login`.
- Sesión: `GET /api/auth/me`, `POST /api/auth/logout`.
- El resto de las rutas de negocio requiere sesión válida y CSRF para mutaciones.

## Primer administrador

No se crean usuarios predeterminados. La inicialización debe ejecutarse mediante un procedimiento local autorizado, definiendo explícitamente identificación, nombre, correo y una contraseña segura de al menos 12 caracteres. Nunca se deben guardar contraseñas en el repositorio, en scripts ni en documentación. La base objetivo debe comprobarse antes de ejecutar cualquier inicialización.

## Consideraciones de producción

El límite de intentos está en memoria del proceso; para múltiples instancias debe trasladarse a un almacén compartido. En producción se requiere HTTPS, `Secure` en cookies y una política de origen frontend explícita.
