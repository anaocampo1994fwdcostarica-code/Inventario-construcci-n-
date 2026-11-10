# Reportes y análisis de inventario

La ruta `/reportes` consulta datos reales del backend y organiza la información en Resumen, Existencias, Movimientos, Compras y recepciones, y Alertas.

## Endpoints utilizados

- `/api/materiales`
- `/api/ubicaciones`
- `/api/inventario/stock`
- `/api/movimientos`
- `/api/ordenes-compra`
- `/api/ordenes-compra/:id/recepciones`
- `/api/alertas`
- `/api/inventario/reorden`

No se crearon endpoints nuevos porque los contratos existentes permiten construir los reportes solicitados.

## Indicadores y filtros

Se muestran materiales, existencias, movimientos, órdenes y alertas activas. Los filtros disponibles son fecha inicial, fecha final, material, ubicación y tipo de movimiento. Las tablas de existencias no suman unidades de medida diferentes.

El stock se consulta desde `/api/inventario/stock`; los reportes no lo modifican. Las órdenes aprobadas no se interpretan como recibidas. El avance de compras usa `cantidad` y `cantidadRecibida` de sus detalles.

## Gráficos

Recharts muestra conteos de movimientos por día, órdenes por estado y alertas por tipo. El gráfico de movimientos cuenta registros para evitar sumar cantidades incompatibles; los traslados no se presentan como entradas netas.

## Exportación

Existencias y movimientos se pueden exportar a CSV UTF-8 con BOM para Excel. La exportación respeta los filtros activos y escapa comillas. Los valores que comienzan con `=`, `+`, `-` o `@` se protegen contra inyección de fórmulas.

## Limitaciones

No se genera PDF, no existe paginación en los endpoints actuales y las recepciones se consultan por orden. El backend no proporciona una cantidad sugerida de compra ni una categoría de material, por lo que no se inventan esos datos. La advertencia del bundle de Recharts permanece.
