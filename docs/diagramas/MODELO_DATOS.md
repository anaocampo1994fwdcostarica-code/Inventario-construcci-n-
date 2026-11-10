# Modelo de datos — Gestión de inventarios

## Motor de base de datos

La implementación utiliza **MySQL 8** mediante Prisma 7.10.1. Las reglas de
stock, trazabilidad y detección de compras duplicadas son independientes del
motor. Aún no se han ejecutado migraciones ni se ha creado la base física.

## Entidades

- **Usuario**: identifica a la persona responsable de órdenes, movimientos, atención de alertas y auditoría.
- **Material**: catálogo de materiales con parámetros de reposición. `codigo` es único.
- **Ubicacion**: representa una bodega u obra y permite calcular existencias por sitio.
- **Proveedor**: datos de contacto y relación con órdenes de compra.
- **OrdenCompra**: cabecera de una compra, con proveedor, responsable, estado, fecha y total.
- **DetalleOrdenCompra**: materiales solicitados, cantidad, precio y cantidad recibida.
- **MovimientoInventario**: historial inmutable de entradas, salidas, traslados y ajustes.
- **AlertaInventario**: alertas por material y ubicación, incluyendo reposición y compras potencialmente duplicadas.
- **Auditoria**: registro de acciones realizadas sobre entidades del sistema.

## Relaciones principales

- Un proveedor tiene muchas órdenes de compra.
- Una orden pertenece a un proveedor y a un responsable, y contiene muchos detalles.
- Cada detalle corresponde a un material; la combinación orden-material es única.
- Un movimiento pertenece a un material y a un usuario responsable.
- Un movimiento puede referenciar origen, destino, orden y detalle de orden.
- Una alerta pertenece a un material y una ubicación.
- Una auditoría pertenece a un usuario y puede identificar la entidad afectada.

## Integridad y reglas de negocio

- Los códigos de material, ubicación y proveedor, las identificaciones de usuario y los números de orden son únicos.
- Cantidades, stocks y demandas usan `Decimal`; el dinero usa `Decimal(14,2)`. No se usa `Float` para importes.
- `cantidad`, stocks y demandas deben ser mayores o iguales a cero. La validación se debe aplicar en servicios antes de insertar.
- Las relaciones históricas usan `onDelete: Restrict` para impedir borrar materiales, usuarios, ubicaciones u órdenes con historial.
- Los movimientos no se editan ni eliminan como operación normal; las correcciones se registran como nuevos ajustes.
- Reglas condicionales de servicio: una entrada requiere destino; una salida requiere origen; un traslado requiere origen y destino distintos; un ajuste requiere `sentidoAjuste`; una entrada asociada a compra debe apuntar a su detalle.

## Cálculo del stock

No existe una columna de stock editable. Para un material y ubicación, el stock se obtiene agregando movimientos:

- `ENTRADA`: suma en `ubicacionDestinoId`.
- `SALIDA`: resta en `ubicacionOrigenId`.
- `TRASLADO`: resta en origen y suma en destino dentro del mismo movimiento.
- `AJUSTE`: suma o resta según `sentidoAjuste`.

La cantidad debe ser siempre positiva; el signo se determina por el tipo y el sentido del movimiento. Esto evita duplicar existencias globales durante un traslado.

## Punto de reorden

La fórmula propuesta es:

```text
stockSeguridad = (demandaDiariaMaxima - demandaDiariaPromedio) * tiempoEntregaDias
puntoReorden = (demandaDiariaPromedio * tiempoEntregaDias) + stockSeguridad
```

Cuando el stock calculado de una ubicación quede en o por debajo del punto de reorden, el servicio puede crear una alerta `PUNTO_REORDEN`. Los parámetros se almacenan en `Material` y el valor se calcula, no se persiste como dato duplicado.

## Trazabilidad

Una entrada puede apuntar a `DetalleOrdenCompra`, que a su vez identifica la orden, proveedor, material, precio y cantidad solicitada. `documentoOrigen` permite registrar factura, recepción u otro documento. `Auditoria` conserva quién realizó acciones relevantes.

## Detección de compras duplicadas

La detección se realizará antes de aprobar o registrar una orden. Se propone buscar órdenes no canceladas que cumplan:

1. mismo proveedor;
2. mismo material en algún detalle;
3. cantidades similares dentro de una tolerancia configurable, por ejemplo `cantidadTolerancia = 0.10` (10%);
4. fechas separadas por una ventana configurable, por ejemplo `ventanaDias = 7`.

La regla debe devolver una advertencia, no borrar ni fusionar órdenes automáticamente. La tolerancia y la ventana deben mantenerse en configuración de aplicación para poder ajustarlas sin cambiar el esquema.
