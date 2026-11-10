# Frontend de órdenes de compra

## Implementación

La ruta `/ordenes-compra` consume la API existente y permite listar, filtrar, consultar, crear, editar y cambiar el estado de órdenes. Los proveedores, materiales y responsables se cargan desde sus catálogos reales.

## Contrato utilizado

Cada orden usa `numero`, `proveedorId`, `responsableId`, `fecha`, `observaciones` y `detalles`. Cada detalle usa `materialId`, `cantidad` y `precioUnitario`. El backend calcula `subtotal` y `total`; el cálculo mostrado en pantalla es únicamente informativo.

Endpoints conectados:

- `GET /api/ordenes-compra`
- `GET /api/ordenes-compra/:id`
- `POST /api/ordenes-compra/verificar-duplicados`
- `POST /api/ordenes-compra`
- `PUT /api/ordenes-compra/:id`
- `PATCH /api/ordenes-compra/:id/estado`

## Validaciones y duplicados

El formulario exige número, proveedor, responsable, fecha y al menos un detalle. Las cantidades deben ser positivas, los precios no negativos y no se permite repetir un material dentro de la orden. Antes de guardar se consulta la detección de duplicados. Si existen coincidencias, se solicita confirmación explícita; la operación no se duplica por doble clic mientras la petición está guardando.

La detección usa las reglas del backend: mismo proveedor, material coincidente, tolerancia de cantidad del 10% y ventana de siete días.

## Estados

Se respetan las transiciones del backend:

- `BORRADOR` → `SOLICITADA` o `CANCELADA`.
- `SOLICITADA` → `APROBADA` o `CANCELADA`.
- `APROBADA` → `PARCIALMENTE_RECIBIDA`, `RECIBIDA` o `CANCELADA`.
- `PARCIALMENTE_RECIBIDA` → `RECIBIDA`.

Las órdenes recibidas o canceladas no son editables. La pantalla no crea movimientos ni incrementa existencias al crear, aprobar o cancelar una orden.

## Limitaciones

La recepción de materiales queda pendiente porque todavía no existe un flujo frontend/backend de recepción comprobado. No se implementan alertas visuales ni reportes avanzados en esta etapa.
