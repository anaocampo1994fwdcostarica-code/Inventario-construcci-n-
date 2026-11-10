# Migraciones y datos iniciales

## Migraciones

El proyecto usa MySQL 8, Prisma 7.10.1 y `@prisma/adapter-mariadb`.
Las migraciones versionadas son:

- `20261109175050_init_inventario_construccion`
- `20261109190000_recepciones_seguras`
- `20261109210000_autenticacion_sesiones`

En una base nueva se aplican con:

```powershell
cd backend
npx prisma migrate deploy
npm run prisma:validate
```

El estado debe comprobarse por base con `npx prisma migrate status`.

## Seed reproducible

La migración no inserta datos. Para una base aislada de demostración, configurar
`SEED_DATABASE_NAME` con el nombre exacto de la base y
`SEED_ADMIN_PASSWORD` localmente, y ejecutar:

```powershell
npm run seed
```

El seed crea materiales, ubicaciones, proveedores, órdenes, recepción,
movimientos, una alerta y una auditoría. Usa IDs deterministas, transacción,
Argon2id para el usuario de demostración e ignora registros seed ya existentes.
Bloquea la base de desarrollo salvo autorización explícita.

No se incluyen credenciales, contraseñas, respaldos SQL ni datos reales en el
repositorio.
