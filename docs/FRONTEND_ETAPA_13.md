# Frontend — Etapa 13

## Estructura

- `src/components/AppLayout.jsx`: sidebar, header y navegación responsiva.
- `src/components/UI.jsx`: estados de carga, vacío, error, tabla, badges y encabezados.
- `src/pages/Dashboard.jsx`: indicadores, gráficos y alertas activas.
- `src/pages/CatalogPage.jsx`: consultas de materiales, ubicaciones y proveedores.
- `src/pages/OperationsPage.jsx`: consultas de movimientos, órdenes y alertas.
- `src/pages/ReportsPage.jsx`: estado inicial de reportes.
- `src/services/api.js`: cliente Axios centralizado.

## Rutas

```text
/                  Dashboard
/materiales        Materiales
/ubicaciones       Ubicaciones
/proveedores       Proveedores
/movimientos       Movimientos
/ordenes-compra    Órdenes de compra
/alertas           Alertas
/reportes          Reportes
```

## Cliente API

Axios utiliza `VITE_API_URL`. El valor de desarrollo recomendado es:

```env
VITE_API_URL=http://localhost:3000/api
```

No se incluyen credenciales en el frontend. Los errores de red y respuestas
HTTP 400, 404, 409 y 500 se convierten en mensajes de interfaz mediante el
interceptor del cliente.

## Endpoints consumidos

- `/materiales`
- `/ubicaciones`
- `/proveedores`
- `/movimientos`
- `/ordenes-compra`
- `/alertas?estado=ACTIVA`
- `/inventario/stock`

El dashboard combina estas respuestas desde el frontend. Cuando las tablas
están vacías se muestran estados vacíos, sin números ficticios.

## Diseño

La interfaz utiliza fondo claro, sidebar oscuro, acento ámbar industrial,
tarjetas con bordes suaves, iconos Lucide, tablas legibles y layout adaptable a
dispositivos móviles. El menú lateral se convierte en un drawer en pantallas
pequeñas.

## Inicio

Frontend:

```bash
cd frontend
npm run dev
```

Backend:

```bash
cd backend
npm start
```

## Validación

```bash
npm run lint
npm run build
```

El build y lint de esta etapa fueron exitosos. Vite emite únicamente una
advertencia informativa sobre el tamaño del bundle de Recharts.

## Pendientes

- Formularios CRUD completos.
- Autenticación y autorización reales.
- Paginación y filtros avanzados.
- Reportes operativos completos.
- Optimización del bundle mediante división de código.
