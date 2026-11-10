# Frontend de alertas y puntos de reorden

La ruta `/alertas` consume las APIs reales de alertas y reorden, sin modificar parámetros de inventario ni crear datos.

## Endpoints utilizados

- `GET /api/alertas`
- `GET /api/alertas/:id`
- `PATCH /api/alertas/:id/estado`
- `POST /api/alertas/evaluar`
- `GET /api/inventario/reorden`
- `GET /api/inventario/reorden/:materialId`

## Funcionalidades

Incluye listado ordenado por fecha, búsqueda por material y descripción, filtros por tipo y estado, detalle de alerta y cambio de estado con confirmación. Las alertas históricas no se eliminan.

La evaluación es manual mediante “Actualizar evaluación”. El botón se deshabilita durante la petición y después se vuelven a cargar alertas y reorden. No se ejecutan evaluaciones automáticas al montar la página.

## Reorden

La tabla distingue stock actual, stock de seguridad y punto de reorden. El análisis individual muestra la fórmula del backend:

```text
stock de seguridad = (demanda máxima - demanda promedio) * tiempo de entrega
punto de reorden = demanda promedio * tiempo de entrega + stock de seguridad
```

No se muestra una cantidad sugerida de compra porque el backend no la proporciona.

## Limitaciones

No se implementan autenticación, reportes avanzados ni prioridades porque no existen en el contrato actual del backend.
