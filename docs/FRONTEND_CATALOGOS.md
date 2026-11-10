# Frontend de catálogos

## Componentes

- `CatalogPage`: pantalla genérica reutilizable para materiales, ubicaciones y proveedores.
- `Modal`: contenedor accesible para formularios y detalles.
- `ConfirmDialog`: confirmación antes de eliminar.
- `DataTable`: tabla reutilizable con acciones de consulta, edición y eliminación.
- `StatusBadge`: representación visual de tipos y estados.

## Catálogos y campos

- Materiales: código, nombre, descripción, unidad, stocks mínimo/máximo, demandas promedio/máxima y tiempo de entrega.
- Ubicaciones: código, nombre, tipo (`BODEGA`/`OBRA`) y dirección.
- Proveedores: identificación, nombre, correo, teléfono y dirección.

## Validaciones

Los formularios validan campos obligatorios, valores numéricos no negativos,
stock máximo mayor o igual al mínimo y demanda máxima mayor o igual al promedio.
Los conflictos de unicidad devueltos por la API se muestran al usuario.

## Endpoints

Cada catálogo utiliza GET, POST, PUT y DELETE mediante el cliente Axios de
`frontend/src/services/api.js`. No se crean datos simulados ni escrituras al
cargar las pantallas.

## Funcionalidades pendientes

- Paginación.
- Autenticación y autorización.
- Formularios de movimientos, órdenes y alertas.
