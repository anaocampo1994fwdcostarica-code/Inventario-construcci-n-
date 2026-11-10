# Recepción de órdenes de compra

## Endpoints

- `POST /api/ordenes-compra/:id/recepciones`
- `GET /api/ordenes-compra/:id/recepciones`
- `GET /api/ordenes-compra/:id/recepciones/:recepcionId`

El endpoint recibe `claveIdempotencia`, `usuarioId`, `ubicacionId`, `detalles` con `detalleOrdenCompraId` y `cantidad`, además de `referencia` y `observaciones` opcionales.

## Reglas

Solo se reciben órdenes `APROBADA` o `PARCIALMENTE_RECIBIDA`. El responsable debe existir y estar activo; la ubicación debe existir; cada detalle debe pertenecer a la orden, no repetirse y no superar su cantidad pendiente.

Una recepción parcial deja la orden en `PARCIALMENTE_RECIBIDA`; cuando todos los detalles están completos pasa a `RECIBIDA`. El cambio manual de estado ya no permite saltar directamente a estados de recepción.

## Transacción e inventario

La operación se ejecuta en una transacción Prisma única. Registra encabezado, detalles, movimientos `ENTRADA`, cantidades recibidas, estado, auditoría y evaluación de alertas. Un fallo revierte toda la recepción. No se usa el servicio de movimientos porque abriría otra operación de concurrencia independiente.

Antes de leer cantidades pendientes se adquiere `GET_LOCK` por orden. El lock se libera después de terminar la transacción, incluso en errores. No se anidan locks de material.

## Idempotencia

La solicitud se normaliza ordenando detalles por `detalleOrdenCompraId`, normalizando cantidades a tres decimales, recortando textos y convirtiendo opcionales ausentes a `null`. Se calcula SHA-256 y se almacena en `solicitudHash` junto con `claveIdempotencia`.

- Misma clave y misma huella: devuelve la recepción existente sin crear movimientos.
- Misma clave y huella diferente: responde `409`.
- La restricción `UNIQUE` de MySQL respalda la protección persistente.

Cada `DetalleRecepcion` puede generar como máximo un movimiento mediante la restricción única de `MovimientoInventario.detalleRecepcionId`.

## Estados y errores

`400` indica solicitud inválida; `404`, recurso inexistente; `409`, orden no habilitada, exceso, usuario inactivo, clave incompatible o conflicto de concurrencia; `500`, error inesperado.

## Pruebas

La prueba real se ejecuta con:

```bash
npm run test:integration:receipts
```

Verifica recepción parcial, total, cantidades acumuladas, estado `RECIBIDA`, reintento idempotente, clave incompatible, sobre-recepción y dos solicitudes simultáneas. Limpia únicamente registros con prefijo `RCV-TEST-` en `gestion_inventario_construccion_test`.
