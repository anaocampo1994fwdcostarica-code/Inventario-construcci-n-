# API de órdenes de compra

Base local: `http://localhost:3000`

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/ordenes-compra` | Crea cabecera y detalles en una transacción. |
| GET | `/api/ordenes-compra` | Lista órdenes con proveedor, responsable y detalles. |
| GET | `/api/ordenes-compra/:id` | Consulta una orden y sus movimientos asociados. |
| PUT | `/api/ordenes-compra/:id` | Actualiza una orden abierta y recalcula importes. |
| PATCH | `/api/ordenes-compra/:id/estado` | Cambia el estado siguiendo el flujo permitido. |
| POST | `/api/ordenes-compra/verificar-duplicados` | Analiza una propuesta sin guardarla. |

## Ejemplo de creación

```json
{
  "numero": "OC-2026-001",
  "proveedorId": "proveedor-id",
  "responsableId": "usuario-id",
  "fecha": "2026-11-09",
  "observaciones": "Compra para obra norte",
  "detalles": [
    {
      "materialId": "material-id",
      "cantidad": 100,
      "precioUnitario": 12.5
    }
  ]
}
```

El servidor calcula cada `subtotal` como `cantidad * precioUnitario` y el
`total` como la suma de subtotales. Los valores enviados como total o subtotal
no se aceptan como fuente de verdad.

## Validaciones

- La orden requiere número, proveedor, responsable y al menos un detalle.
- Cantidades deben ser mayores que cero.
- Precios unitarios no pueden ser negativos.
- Proveedor, responsable y materiales deben existir.
- El número de orden es único.
- Las órdenes recibidas, parcialmente recibidas o canceladas no se pueden editar.
- Las órdenes con movimientos asociados quedan protegidas.
- No existe eliminación de órdenes en esta etapa para conservar trazabilidad.

## Estados y flujo

Estados definidos por Prisma:

```text
BORRADOR
SOLICITADA
APROBADA
PARCIALMENTE_RECIBIDA
RECIBIDA
CANCELADA
```

Transiciones permitidas:

- `BORRADOR` → `SOLICITADA` o `CANCELADA`.
- `SOLICITADA` → `APROBADA` o `CANCELADA`.
- `APROBADA` → `PARCIALMENTE_RECIBIDA`, `RECIBIDA` o `CANCELADA`.
- `PARCIALMENTE_RECIBIDA` → `RECIBIDA`.
- `RECIBIDA` y `CANCELADA` son estados terminales.

## Detección de duplicados

`POST /api/ordenes-compra/verificar-duplicados` recibe la misma propuesta de
compra, pero no la persiste. Busca órdenes no canceladas que tengan:

1. el mismo proveedor;
2. el mismo material en algún detalle;
3. cantidad dentro de una tolerancia del 10%;
4. fecha dentro de una ventana de 7 días.

La respuesta incluye `posibleDuplicado`, órdenes coincidentes, materiales,
cantidades comparadas, fechas y el motivo. Los parámetros son configurables y
son valores iniciales del proyecto, no reglas universales.

La creación de una orden ejecuta la misma advertencia, pero no bloquea
automáticamente la compra. En actualizaciones se puede excluir el identificador
de la orden para no compararla consigo misma cuando se amplíe esa operación.

## Relación con recepción

Crear una orden no crea movimientos ni incrementa stock. En una etapa posterior,
una recepción deberá crear movimientos `ENTRADA` asociados a
`detalleOrdenCompraId` y actualizar `cantidadRecibida` dentro de una transacción.
La recepción deberá rechazar cantidades acumuladas superiores a la cantidad
solicitada y mantener la trazabilidad del documento recibido.

## Errores HTTP

- `200`: consulta, actualización o cambio de estado exitoso.
- `201`: orden creada.
- `400`: datos inválidos o estado no permitido.
- `404`: proveedor, material, responsable u orden inexistente.
- `409`: número duplicado, orden cerrada o conflicto de historial.
- `500`: error interno genérico.

## Limitaciones

- No se implementa recepción automática en esta etapa.
- No se eliminan órdenes para proteger el historial.
- Las pruebas actuales usan mocks y no modifican MySQL.
