# Pruebas de integración MySQL y concurrencia

## Configuración

- Base de desarrollo: `gestion_inventario_construccion`.
- Base de pruebas: `gestion_inventario_construccion_test`.
- Motor verificado: MySQL 8.0.46.
- Migraciones: `prisma migrate deploy` sobre `_test`.
- Script: `backend/scripts/integration-test.js`.

El script exige que `SELECT DATABASE()` sea exactamente
`gestion_inventario_construccion_test`. La URL de prueba se construye en
memoria a partir de la configuración local y nunca se imprime ni se guarda.

## Aislamiento y limpieza

La base de pruebas se verificó antes de crearla. Se aplicó la migración existente
sin crear nuevas migraciones. El script utiliza identificadores `TEST-*`, y en
`finally` elimina únicamente usuarios, proveedores, materiales, ubicaciones,
órdenes, movimientos y alertas creados por la prueba. No utiliza `DROP DATABASE`,
`migrate reset` ni modifica la base de desarrollo.

Después de la ejecución, los conteos de las tablas de datos fueron cero y la
tabla `_prisma_migrations` conservó su registro de migración.

## Flujo probado

1. Usuario, proveedor, material, bodega y obra temporales.
2. Orden de compra.
3. Confirmación de que la orden no aumenta stock.
4. Entrada en bodega.
5. Salida y verificación de reducción.
6. Traslado de bodega a obra.
7. Ajuste positivo y negativo.
8. Historial de movimientos.
9. Cálculo de reorden.
10. Generación de alertas.
11. Evaluación repetida sin alertas activas duplicadas.
12. Detección de compra potencialmente duplicada.

## Concurrencia real

Se ejecutaron dos salidas simultáneas del mismo material. Con stock suficiente
para una sola solicitud:

- una solicitud respondió `201`;
- la otra respondió `409 Stock insuficiente`;
- el stock final nunca fue negativo.

También se ejecutaron dos traslados simultáneos desde la misma bodega; el
resultado fue una aceptación y un rechazo controlado por stock insuficiente.

## Corrección del bloqueo

La implementación inicial liberaba `GET_LOCK` dentro del callback de la
transacción Prisma, antes de que el commit terminara. Eso permitió que dos
solicitudes concurrentes fueran aceptadas.

Se corrigió sin modificar el esquema: `withMaterialLock` abre una conexión
MariaDB dedicada, adquiere el bloqueo advisory por material, ejecuta la
transacción Prisma completa y libera el bloqueo solo después de que la promesa
de la transacción termina. La conexión se cierra en `finally`, incluso ante
errores o rollback.

Esta prueba confirma el comportamiento con MySQL real en `_test`; no se presenta
un mock como evidencia de concurrencia.

## Validaciones

- Prisma Validate: exitoso.
- `prisma migrate status` en `_test`: esquema actualizado.
- Pruebas unitarias: 45 exitosas y 1 omitida por ser la prueba antigua de concurrencia con mocks.
- Pruebas de integración reales: flujo completo, salidas concurrentes y traslados concurrentes exitosos.

## Limitaciones

La prueba de integración no se conserva como datos permanentes. La base de
pruebas permanece creada para futuras ejecuciones, pero sus tablas de negocio
quedan vacías después de cada corrida.
