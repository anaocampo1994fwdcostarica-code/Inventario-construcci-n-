# Usuarios y responsables

## Modelo utilizado

Se reutiliza `Usuario` de Prisma sin modificar el esquema. Sus campos expuestos son `id`, `identificacion`, `nombre`, `correo`, `rol`, `activo` y fechas de auditoría. No existen contraseñas ni tokens en este modelo.

Roles permitidos: `ADMINISTRADOR`, `ENCARGADO_BODEGA`, `SUPERVISOR_OBRA` y `CONSULTA`.

## API

- `GET /api/usuarios`: lista usuarios sin campos sensibles.
- `GET /api/usuarios/:id`: consulta un usuario.
- `POST /api/usuarios`: crea un responsable validando identificación, nombre, correo y rol.
- `PUT /api/usuarios/:id`: actualiza datos no sensibles y permite desactivación lógica mediante `activo`.

Las identificaciones y correos duplicados responden con conflicto `409`; roles o datos inválidos responden `400`; un usuario inexistente responde `404`. No se implementa `DELETE`, porque los usuarios pueden estar referenciados por movimientos, órdenes y auditorías.

## Selector de responsables

`MovementPage` consulta `GET /api/usuarios`, filtra usuarios activos y muestra nombre y rol. El movimiento envía el `id` real seleccionado. Si no hay usuarios, se deshabilita el registro y se informa que debe registrarse un responsable.

## Seguridad y pendientes

Esta API todavía no tiene autenticación ni autorización. La escritura de usuarios debe limitarse al entorno local de desarrollo y no debe exponerse públicamente. El usuario seleccionado representa una referencia operativa, no una identidad verificada. Quedan pendientes login, sesiones o tokens, autorización por rol, protección de la API y auditoría autenticada.

El selector puede reutilizarse posteriormente en el formulario de órdenes de compra usando la misma consulta y componente.
