# Frontend de recepciones

La recepción se integra en el detalle de `/ordenes-compra` sin modificar el esquema ni crear movimientos desde React.

## Componentes

- `ReceiptForm`: ubicación, responsable, referencia, observaciones y cantidades por detalle.
- `ReceiptHistory`: historial de recepciones confirmadas.
- `Details`: cantidades solicitadas, recibidas, pendientes, estado y botón de recepción.

## Endpoints

- `GET /api/ubicaciones`
- `GET /api/usuarios`
- `POST /api/ordenes-compra/:id/recepciones`
- `GET /api/ordenes-compra/:id/recepciones`
- `GET /api/ordenes-compra/:id/recepciones/:recepcionId`

Se usan exclusivamente IDs obtenidos desde la API. Los usuarios se filtran por `activo`.

## Validaciones

Solo se muestra “Recibir materiales” para órdenes `APROBADA` o `PARCIALMENTE_RECIBIDA`. Se exige ubicación, responsable y al menos un detalle con cantidad positiva. La cantidad máxima se calcula desde `cantidad - cantidadRecibida`; no se envían detalles con cero.

Después de una respuesta exitosa se vuelven a consultar la orden y sus recepciones. El frontend no mantiene el stock como fuente de verdad.

## Idempotencia y errores

Cada intención de recepción obtiene una clave con `crypto.randomUUID()`. La clave se conserva durante un reintento sin modificar la solicitud. Si el usuario cambia la solicitud después de un resultado incierto, se genera una clave nueva. El botón se deshabilita durante el envío.

Un error de red conserva la clave y muestra que el resultado puede ser incierto; no se reenvía automáticamente con otra clave. Los conflictos `409`, errores de validación y errores del servidor se muestran mediante el manejador central de Axios.

## Historial y limitaciones

Las recepciones confirmadas son de solo lectura. Se pueden consultar sus detalles y movimientos relacionados. No se implementan edición ni eliminación, alertas visuales avanzadas, reportes ni autenticación en esta etapa.
