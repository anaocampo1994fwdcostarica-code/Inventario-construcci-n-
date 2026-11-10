# Frontend de movimientos y existencias

## Componentes

- `MovementPage`: historial, filtros, existencias y registro de movimientos.
- `MovementForm`: formulario compartido para entrada, salida, traslado y ajuste.
- `Modal`, `DataTable`, `StatusBadge`, `LoadingState`, `EmptyState` y
  `ErrorState`: componentes visuales reutilizados.

## Endpoints consumidos

```text
GET  /api/movimientos
GET  /api/movimientos/:id
POST /api/movimientos
GET  /api/inventario/stock
GET  /api/inventario/reorden
```

El frontend no calcula existencias: usa los saldos entregados por la API y solo
combina los datos de material y punto de reorden para presentarlos.

## Formularios

- Entrada: material, cantidad, destino, usuario, documento y observaciones.
- Salida: material, cantidad, origen, usuario, documento y observaciones.
- Traslado: material, cantidad, origen, destino, usuario y observaciones.
- Ajuste: material, sentido (`INCREMENTO`/`DECREMENTO`), ubicación, cantidad,
  usuario y justificación obligatoria.

Las cantidades deben ser positivas. El frontend muestra el stock conocido para
salidas, traslados y ajustes negativos, pero el backend sigue siendo la
autoridad definitiva y sus respuestas `409` se muestran sin ocultarlas.

## Usuario responsable

El backend no expone actualmente un endpoint de usuarios ni autenticación. Por
eso el formulario solicita explícitamente el `usuarioId` de un usuario existente
y no inventa opciones ni crea usuarios automáticamente.

## Historial y experiencia

Los movimientos solo tienen consulta y detalle; no se muestran acciones de
edición o eliminación. Después de registrar, se refrescan historial,
existencias y datos de reorden sin recargar la página. Hay estados de carga,
vacío, éxito, red y errores HTTP.

## Limitaciones

- Falta un selector de usuarios hasta que exista `/api/usuarios` o autenticación.
- No se implementan todavía formularios frontend de órdenes de compra ni alertas.
- Las pruebas automatizadas de escritura frontend deben usar mocks o una base
  aislada; no se insertan datos en desarrollo durante el build.
