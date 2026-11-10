# Etapa 22A — Auditoría de autenticación

## Resultado

La migración de autenticación está aplicada en desarrollo y pruebas. El modelo `Usuario` conserva los cuatro roles aprobados y `Sesion` almacena tokens hash, expiración y revocación.

No se creó el primer administrador y no se modificaron registros de desarrollo durante esta auditoría.

## Roles y permisos observados

| Rol | Perfil | Permisos efectivos |
|---|---|---|
| `ADMINISTRADOR` | Administrador | Catálogos, usuarios, movimientos, compras, recepciones, alertas y cambios de estado |
| `ENCARGADO_BODEGA` | Empleado | Lecturas y operaciones de inventario, compras y recepciones; no administra usuarios ni aprueba estados restringidos |
| `SUPERVISOR_OBRA` | Empleado | Mismos permisos operativos del rol de bodega; conserva su rol específico |
| `CONSULTA` | Empleado de solo lectura | Consultas de catálogos, stock, órdenes, recepciones, alertas y reportes; no puede escribir |

La autorización se aplica en `backend/src/middlewares/auth.js` y las rutas de negocio están protegidas por el middleware global. El endpoint de salud permanece público para monitoreo.

## Autenticación y sesiones

- Login: `POST /api/auth/login`.
- Sesión actual: `GET /api/auth/me`.
- Logout y revocación: `POST /api/auth/logout`.
- Contraseñas: Argon2id mediante `argon2`.
- Longitud mínima al crear o cambiar contraseña: 12 caracteres.
- Cookie de sesión: `HttpOnly`, `SameSite=Lax`, `Secure` en producción.
- CSRF: token separado en cookie no HttpOnly y cabecera `X-CSRF-Token` para mutaciones.
- Sesiones expiradas, revocadas o de usuarios inactivos son rechazadas.
- Las respuestas públicas no incluyen `passwordHash`.
- CORS usa un origen frontend explícito y `credentials: true`.

## Identidad y suplantación

Movimientos, órdenes de compra y recepciones sobrescriben el identificador recibido con el usuario autenticado. El frontend no puede suplantar al responsable mediante un `usuarioId` arbitrario. Las pruebas de autenticación comprobaron esta barrera para operaciones protegidas.

## Inicialización del primer administrador

No existe actualmente un mecanismo ejecutable de inicialización única. El alta normal de usuarios requiere una sesión administrativa, por lo que no sirve para el primer usuario cuando la base está vacía.

Procedimiento propuesto para la Etapa 22B, pendiente de autorización:

1. Crear un script CLI local de uso único, no un endpoint público.
2. Exigir variables introducidas localmente para identificación, nombre, correo y contraseña; nunca valores predeterminados ni valores versionados.
3. Rechazar cualquier base cuyo nombre no sea `gestion_inventario_construccion`.
4. Consultar dentro de una transacción si ya existe un usuario con rol `ADMINISTRADOR`; si existe, abortar.
5. Validar contraseña de al menos 12 caracteres y generar el hash con Argon2id.
6. Crear únicamente la cuenta administrativa activa, con restricciones únicas normales.
7. Usar una transacción y una condición de unicidad para evitar dos inicializaciones concurrentes.
8. No imprimir contraseña, hash, token ni URL de conexión.
9. Verificar el registro creado sin devolver el hash y probar el login solo después de autorización explícita.

No ejecutar este procedimiento en la Etapa 22A.

## Pruebas ejecutadas

- Prisma Validate: exitoso.
- Unitarias backend: 49 exitosas y 1 omitida preexistente.
- Integración general en `gestion_inventario_construccion_test`: exitosa.
- Integración de recepciones: exitosa.
- Integración de autenticación: login, contraseña inválida, sesión, logout y restricción de empleado: exitosa.
- Frontend lint: exitoso.
- Frontend build: exitoso.

Los mensajes de stock insuficiente, idempotencia y sobre-recepción observados durante integración son rechazos esperados y validados por las pruebas.

## Riesgos pendientes

- Falta implementar el inicializador único del primer administrador.
- El límite de intentos de login está en memoria; en múltiples instancias debe centralizarse.
- Debe habilitarse HTTPS real y cookies `Secure` en producción.
- La prueba de autenticación existente cubre administrador y encargado; deben ampliarse casos explícitos para supervisor, consulta, usuario inactivo, sesión expirada, CSRF y suplantación.

## Requisitos para autorizar Etapa 22B

- Aprobar la implementación del script de inicialización única.
- Confirmar que la cuenta será creada únicamente en desarrollo.
- Proporcionar la contraseña de forma local, sin enviarla al repositorio ni registrarla.
- Ejecutar primero una prueba equivalente en la base `_test` y limpiar los datos temporales.
