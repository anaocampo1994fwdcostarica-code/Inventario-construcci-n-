# ETAPA 47 — Auditoría de roles y permisos

## Causa encontrada

La API ya resolvía el rol desde la sesión y aplicaba autorización centralizada, pero el frontend trataba `/usuarios` como una fuente de datos auxiliar para compras y recepciones. Para `ENCARGADO_BODEGA` esa ruta correctamente devuelve 403, por lo que se rompían operaciones legítimas. Además, la pantalla de catálogos mostraba acciones de escritura a roles de solo consulta.

## Matriz verificada

| Rol | Módulo | Acción | Esperado | Backend | Frontend | Estado |
|---|---|---|---|---|---|---|
| ADMINISTRADOR | Usuarios | listar/crear/editar y roles | permitir | permitir | visible | Verificado |
| ENCARGADO_BODEGA | Usuarios | cualquier operación | denegar | 403 | ruta protegida/redirección | Verificado |
| ENCARGADO_BODEGA | Materiales, ubicaciones, proveedores | consultar | permitir | permitir | visible | Verificado |
| ENCARGADO_BODEGA | Catálogos | crear/editar/eliminar | denegar | 403 | acciones de escritura ocultas | Verificado |
| ENCARGADO_BODEGA | Movimientos | consultar/registrar | permitir | permitir | visible | Verificado |
| ENCARGADO_BODEGA | Existencias/reorden | consultar | permitir | permitir | visible | Verificado |
| ENCARGADO_BODEGA | Compras | consultar/crear/editar/recepcionar | permitir según estado | permitir | visible; usa sesión actual | Verificado |
| ENCARGADO_BODEGA | Compras | aprobar/cancelar | denegar | 403 | selector de estado oculto | Verificado |
| ENCARGADO_BODEGA | Alertas | consultar | permitir | permitir | visible | Verificado |
| ENCARGADO_BODEGA | Alertas | evaluar/cambiar estado | denegar | 403 | evaluación y selector de estado ocultos | Verificado |
| ADMINISTRADOR | Alertas y reportes | operaciones administrativas/consulta | permitir | permitir | visible | Verificado |
| No autenticado | API protegida | cualquier operación | denegar | 401 | redirección a login | Verificado |

## Cambios realizados

- Se añadió protección de rol para la ruta frontend `/usuarios`.
- Se ocultaron altas, ediciones y eliminaciones de catálogos para bodeguero, conservando la consulta.
- Compras y recepciones dejaron de consultar `/usuarios`; usan el usuario de la sesión. El backend continúa sobrescribiendo `responsableId`/`usuarioId` con el actor autenticado.
- Se agregaron pruebas automatizadas de 401, 403 y permisos de administrador/bodeguero.

## Pruebas

- Backend: `npm test` — 53 aprobadas, 1 omitida.
- Frontend: `npm run build` — correcto.
- Frontend: `npm run lint` — 0 errores ni advertencias.
- No se modificó la base, seed, contraseñas, main, commit ni push.

## Riesgos pendientes

Evidencia visual: con `ENCARGADO_BODEGA` Compras conserva crear/editar/recepcionar, pero no muestra el selector de aprobar/cancelar; Alertas conserva consulta y detalle, pero no muestra evaluación ni cambio de estado. Con `ADMINISTRADOR` se mantienen todas esas acciones.
