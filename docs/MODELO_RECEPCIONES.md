# Modelo de recepciones seguras

## Cambios realizados

Se agregaron dos modelos Prisma sin modificar las tablas de negocio existentes:

- `RecepcionCompra`: identifica la orden, responsable, ubicación, fecha, referencia, observaciones y la operación de recepción.
- `DetalleRecepcion`: registra la cantidad recibida para cada detalle de una orden.

También se agregaron relaciones inversas a `Usuario`, `Ubicacion`, `OrdenCompra` y `DetalleOrdenCompra`.

`MovimientoInventario` ahora puede asociarse opcionalmente con `RecepcionCompra` y `DetalleRecepcion`. Las relaciones son opcionales para mantener compatibles los movimientos históricos y los movimientos que no provienen de compras.

## Integridad e idempotencia

`claveIdempotencia` es única en la base de datos. `solicitudHash` almacena una huella SHA-256 de la solicitud normalizada. Cuando se implemente el endpoint, la misma clave con la misma huella deberá devolver el resultado existente; la misma clave con una huella diferente deberá responder conflicto.

`DetalleRecepcion` tiene una restricción única por `(recepcionId, detalleOrdenCompraId)`. Además, `MovimientoInventario.detalleRecepcionId` es único: un detalle de recepción solo puede generar una entrada contabilizada.

Las claves foráneas usan `Restrict` para impedir la destrucción de la trazabilidad. La relación opcional desde movimientos hacia la recepción usa `SET NULL` en la referencia al encabezado, mientras que la referencia al detalle usa `Restrict`.

## Migración

Migración creada:

`backend/prisma/migrations/20261109190000_recepciones_seguras/migration.sql`

El SQL crea `RecepcionCompra`, `DetalleRecepcion`, columnas opcionales en `movimientoinventario`, índices únicos y claves foráneas. No contiene `DROP TABLE`, eliminación de columnas ni cambios destructivos.

Fue aplicada exclusivamente a `gestion_inventario_construccion_test` mediante `prisma migrate deploy`. No fue aplicada a `gestion_inventario_construccion`.

## Estrategia futura

La recepción deberá bloquear la orden o sus detalles dentro de una transacción, validar cantidades pendientes, insertar el encabezado y detalles, crear movimientos `ENTRADA`, incrementar `cantidadRecibida` y actualizar el estado. La clave única debe capturarse como conflicto de base de datos, sin depender del frontend.

## Pendientes y riesgos

Todavía no existe el endpoint de recepción ni su frontend. La migración está preparada, pero no se ha probado aún la concurrencia de recepciones ni el rollback de movimientos. Antes de aplicar la migración a desarrollo debe ejecutarse una revisión y una prueba completa en `_test`.
