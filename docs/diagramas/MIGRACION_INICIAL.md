# Migración inicial de inventario

## Configuración

- Motor: MySQL Community Server 8.0.46.
- Host: `localhost`.
- Puerto: `3306`.
- Base de datos: `gestion_inventario_construccion`.
- ORM: Prisma 7.10.1.
- Adaptador: `@prisma/adapter-mariadb` con el driver `mariadb`.
- Migración: `20261109175050_init_inventario_construccion`.

No se incluyen credenciales ni cadenas de conexión en esta documentación.

## Tablas creadas

Tablas de negocio:

- `usuario`
- `material`
- `ubicacion`
- `proveedor`
- `ordencompra`
- `detalleordencompra`
- `movimientoinventario`
- `alertainventario`
- `auditoria`

Tabla interna de Prisma:

- `_prisma_migrations`

Las nueve tablas de negocio quedaron vacías después de la migración.

## Relaciones principales

- Proveedores se relacionan con órdenes de compra.
- Órdenes de compra contienen detalles de materiales.
- Movimientos relacionan materiales, usuarios, ubicaciones y órdenes de compra.
- Alertas relacionan materiales, ubicaciones y usuarios que las atienden.
- Auditorías relacionan usuarios con las entidades auditadas.

## Comandos utilizados

```text
npm run prisma:validate
npx prisma migrate dev --name init_inventario_construccion
npx prisma generate
npx prisma migrate status
npm test
```

También se verificaron la versión del motor, la existencia de las tablas y el
conteo inicial de registros mediante consultas de solo lectura. No se usó
`prisma db push`, no se ejecutó `prisma migrate reset` y no se insertaron datos
semilla.

La inicialización del cliente se verificó con una consulta de lectura `SELECT 1`
usando el adaptador MySQL/MariaDB requerido por Prisma 7.

## Resultado

La base quedó sincronizada con el esquema Prisma. La migración está aplicada y
Prisma reporta que el esquema se encuentra actualizado.
