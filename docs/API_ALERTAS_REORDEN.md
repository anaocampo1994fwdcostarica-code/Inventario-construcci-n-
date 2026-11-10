# Alertas de inventario y puntos de reorden

## Fórmulas

Para cada material:

```text
stockSeguridad =
  (demandaDiariaMaxima - demandaDiariaPromedio)
  * tiempoEntregaDias

puntoReorden =
  (demandaDiariaPromedio * tiempoEntregaDias)
  + stockSeguridad
```

Ejemplo: demanda promedio `5`, demanda máxima `8` y entrega en `3` días:

```text
stockSeguridad = (8 - 5) * 3 = 9
puntoReorden = (5 * 3) + 9 = 24
```

Los cálculos se realizan con `Prisma.Decimal`. `stockMinimo` y `stockMaximo`
continúan siendo límites operativos del catálogo: `stockMinimo` sirve como
referencia de criticidad y `stockMaximo` como límite de reposición, mientras que
el punto de reorden calculado determina cuándo advertir. No se persiste un
`stockActual` ni un punto de reorden duplicado.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/inventario/reorden` | Calcula reorden por material y ubicación. |
| GET | `/api/inventario/reorden/:materialId` | Calcula reorden para un material. |
| GET | `/api/alertas` | Lista alertas con filtros. |
| GET | `/api/alertas/:id` | Consulta una alerta. |
| PATCH | `/api/alertas/:id/estado` | Cambia a `ACTIVA`, `ATENDIDA` o `DESCARTADA`. |
| POST | `/api/alertas/evaluar` | Evalúa materiales y ubicaciones solicitados. |

Filtros disponibles para alertas: `materialId`, `ubicacionId`, `tipo` y
`estado`. La evaluación puede recibir `materialId` y `ubicacionId` para limitar
el alcance; sin filtros evalúa los catálogos existentes.

## Reglas de generación

- `PUNTO_REORDEN`: stock menor o igual al punto de reorden.
- `PUNTO_REORDEN`: también cubre stock por debajo de `stockMinimo` cuando el
  mínimo configurado supera el punto calculado.
- `STOCK_MAXIMO`: stock por encima de `stockMaximo`.
- `STOCK_NEGATIVO`: condición crítica si existiera stock menor que cero.
- No se crean alertas para materiales o ubicaciones inexistentes.
- Solo se crea una alerta activa por material, ubicación y condición.
- Las evaluaciones repetidas son idempotentes.
- Cuando desaparece la condición, la alerta activa pasa a `ATENDIDA`.
- No se elimina el historial de alertas.

## Integración con movimientos

Después de crear una entrada, salida, traslado o ajuste, se evalúan únicamente
las ubicaciones afectadas. La evaluación se ejecuta dentro de la misma
transacción que el movimiento. Si falla la creación o resolución de la alerta,
la transacción completa se revierte y no queda un movimiento confirmado sin su
evaluación correspondiente.

Una salida puede crear una alerta, una entrada puede resolverla, un traslado
evalúa origen y destino, y un ajuste evalúa la ubicación indicada.

## Estados

```text
ACTIVA
ATENDIDA
DESCARTADA
```

## Concurrencia y limitaciones

Las operaciones de stock usan `GET_LOCK` y `RELEASE_LOCK` por material dentro de
una transacción Prisma interactiva. La aplicación garantiza que el código
adquiere y libera el bloqueo en el mismo contexto transaccional; sin embargo, la
prueba de concurrencia contra MySQL real aún está pendiente porque no existe una
base de pruebas aislada. Los mocks no se presentan como evidencia de concurrencia
real.

La evaluación global puede ser costosa si existen muchos materiales y
ubicaciones. Por eso los movimientos evalúan solo las ubicaciones afectadas; la
evaluación global queda disponible como operación explícita.
