# Modelo de datos — Gestión de inventarios

## Motor y estado

La implementación utiliza MySQL 8 mediante Prisma 7.10.1 y el adaptador
`@prisma/adapter-mariadb`. Las migraciones versionadas están en
`backend/prisma/migrations/`. El estado de una base concreta debe comprobarse
con `npx prisma migrate status`; este documento no afirma que todas las bases
remotas estén migradas.

## Entidades y relaciones

- **Usuario**: responsables de órdenes, movimientos, alertas y auditoría.
- **Material**: catálogo con parámetros de reposición y código único.
- **Ubicacion**: bodegas y obras para calcular existencias por sitio.
- **Proveedor**: datos de contacto y órdenes de compra.
- **OrdenCompra** y **DetalleOrdenCompra**: compras, materiales, precios y cantidades recibidas.
- **MovimientoInventario**: historial de entradas, salidas, traslados y ajustes.
- **RecepcionCompra** y **DetalleRecepcion**: recepción idempotente y trazable.
- **AlertaInventario**: alertas por material y ubicación.
- **Auditoria**: acciones realizadas sobre entidades.
- **Sesion**: sesiones opacas con tokens almacenados como hashes.

Las relaciones usan claves foráneas. Los códigos, identificaciones y números de
orden son únicos. Las cantidades y el dinero usan `Decimal`; no se usa `Float`
para importes. Las relaciones históricas usan `onDelete: Restrict` cuando
corresponde.

## Cálculo del stock

No existe una columna de stock editable. Para un material y ubicación, el stock
se calcula agregando movimientos:

- `ENTRADA`: suma en el destino.
- `SALIDA`: resta en el origen.
- `TRASLADO`: resta en el origen y suma en el destino.
- `AJUSTE`: suma o resta según `sentidoAjuste`.

## Punto de reorden

```text
stockSeguridad = (demandaDiariaMaxima - demandaDiariaPromedio) * tiempoEntregaDias
puntoReorden = (demandaDiariaPromedio * tiempoEntregaDias) + stockSeguridad
```

El valor se calcula en el servicio y no se persiste como dato duplicado.

## Trazabilidad y duplicados

Una entrada puede apuntar a un detalle de orden y recepción, identificando la
orden, proveedor, material, cantidad y documento de origen. La detección de
compras potencialmente duplicadas usa mismo proveedor, material, cantidades
dentro del 10 % y fechas dentro de 7 días. La regla genera una advertencia y no
fusiona ni elimina órdenes automáticamente.
