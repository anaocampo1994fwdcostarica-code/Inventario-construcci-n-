# API REST de catálogos

Base URL local: `http://localhost:3000`

Los módulos persisten mediante Prisma 7 y MySQL. Las respuestas de error no
exponen credenciales ni detalles internos.

## Materiales

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/materiales` | Lista materiales ordenados por código. |
| GET | `/api/materiales/:id` | Consulta un material. |
| POST | `/api/materiales` | Crea un material. |
| PUT | `/api/materiales/:id` | Actualiza campos del material. |
| DELETE | `/api/materiales/:id` | Elimina solo si no tiene historial. |

Ejemplo de creación:

```json
{
  "codigo": "CEM-001",
  "nombre": "Cemento gris",
  "descripcion": "Cemento para obra gris",
  "unidadMedida": "saco",
  "stockMinimo": 10,
  "stockMaximo": 100,
  "demandaDiariaPromedio": 5,
  "demandaDiariaMaxima": 8,
  "tiempoEntregaDias": 3
}
```

## Ubicaciones

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/ubicaciones` | Lista ubicaciones. |
| GET | `/api/ubicaciones/:id` | Consulta una ubicación. |
| POST | `/api/ubicaciones` | Crea una ubicación. |
| PUT | `/api/ubicaciones/:id` | Actualiza una ubicación. |
| DELETE | `/api/ubicaciones/:id` | Elimina si no tiene movimientos o alertas. |

El campo `tipo` solo acepta `BODEGA` u `OBRA`.

Ejemplo:

```json
{
  "codigo": "BOD-001",
  "nombre": "Bodega central",
  "tipo": "BODEGA",
  "direccion": "Zona industrial"
}
```

## Proveedores

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/proveedores` | Lista proveedores. |
| GET | `/api/proveedores/:id` | Consulta un proveedor. |
| POST | `/api/proveedores` | Crea un proveedor. |
| PUT | `/api/proveedores/:id` | Actualiza un proveedor. |
| DELETE | `/api/proveedores/:id` | Elimina si no tiene órdenes. |

Ejemplo:

```json
{
  "identificacion": "J-001",
  "nombre": "Materiales del Norte",
  "correo": "ventas@example.com",
  "telefono": "2222-2222",
  "direccion": "San José"
}
```

## Validaciones y códigos HTTP

- `200`: consulta o actualización exitosa.
- `201`: creación exitosa.
- `204`: eliminación exitosa sin contenido.
- `400`: campos obligatorios, enums inválidos o números negativos.
- `404`: registro o ruta inexistente.
- `409`: código/identificación duplicada o registro con historial relacionado.
- `500`: error interno genérico.

Los materiales validan que `stockMaximo >= stockMinimo` y
`demandaDiariaMaxima >= demandaDiariaPromedio`. Las cantidades y el tiempo de
entrega no pueden ser negativos. El stock actual no forma parte de estos
catálogos y continúa calculándose a partir de movimientos.
