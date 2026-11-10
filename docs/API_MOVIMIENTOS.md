# API de movimientos, stock y trazabilidad

Base local: `http://localhost:3000`

## Movimientos

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/movimientos` | Registra una entrada, salida, traslado o ajuste. |
| GET | `/api/movimientos` | Lista el historial con filtros opcionales. |
| GET | `/api/movimientos/:id` | Consulta un movimiento con sus relaciones. |

Filtros disponibles en `GET /api/movimientos`:

```text
materialId, tipo, ubicacionId, usuarioId, fechaDesde, fechaHasta
```

Ejemplo de entrada:

```json
{
  "materialId": "material-id",
  "tipo": "ENTRADA",
  "cantidad": 25,
  "ubicacionDestinoId": "bodega-id",
  "usuarioId": "usuario-id",
  "documentoOrigen": "FACT-001",
  "observaciones": "Recepción de materiales"
}
```

Ejemplo de traslado:

```json
{
  "materialId": "material-id",
  "tipo": "TRASLADO",
  "cantidad": 5,
  "ubicacionOrigenId": "bodega-id",
  "ubicacionDestinoId": "obra-id",
  "usuarioId": "usuario-id",
  "observaciones": "Despacho a obra"
}
```

## Tipos y reglas

- `ENTRADA`: cantidad positiva y destino obligatorio.
- `SALIDA`: cantidad positiva, origen obligatorio y stock suficiente.
- `TRASLADO`: cantidad positiva, origen y destino distintos, y stock suficiente en el origen.
- `AJUSTE`: cantidad positiva, ubicación, `sentidoAjuste` (`INCREMENTO` o `DECREMENTO`) y justificación obligatoria.

Los materiales, usuarios y ubicaciones referenciados deben existir. Las
cantidades cero o negativas se rechazan. Los movimientos no tienen endpoints de
edición o eliminación: una corrección se registra mediante un nuevo ajuste.

## Stock

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/inventario/stock` | Stock global y por ubicación de todos los materiales. |
| GET | `/api/inventario/stock/:materialId` | Stock global y por ubicación de un material. |

Se puede filtrar por `materialId` o `ubicacionId`. El stock se calcula desde el
historial:

- Entrada suma en destino.
- Salida resta en origen.
- Traslado resta en origen y suma en destino, sin cambiar el stock global.
- Ajuste incrementa o decrementa según `sentidoAjuste`.

No existe un campo `stockActual` editable en `Material`.

## Concurrencia

Las operaciones que pueden reducir stock ejecutan una transacción Prisma y
adquieren un bloqueo advisory de MySQL mediante `GET_LOCK` por material. El
bloqueo serializa salidas, traslados y ajustes del mismo material, evitando que
dos solicitudes calculen simultáneamente el mismo saldo disponible. Se libera
con `RELEASE_LOCK` en un bloque `finally`, incluso cuando ocurre un error.

La prueba de concurrencia contra MySQL real queda pendiente porque no existe una
base de datos de pruebas aislada. Las pruebas actuales verifican la lógica de
bloqueo mediante mocks y no alteran la base de desarrollo.

## Trazabilidad y errores

Cada movimiento conserva identificador, fecha, material, cantidad, tipo,
ubicaciones, usuario, documento y observaciones. Las respuestas usan:

- `201`: movimiento creado.
- `200`: consulta exitosa.
- `400`: datos inválidos.
- `404`: material, usuario, ubicación o movimiento inexistente.
- `409`: stock insuficiente o conflicto de operación.
- `500`: error interno genérico.
