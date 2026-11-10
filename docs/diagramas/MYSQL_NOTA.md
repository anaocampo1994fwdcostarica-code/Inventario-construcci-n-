# Base de datos seleccionada

El proyecto utilizará **MySQL 8** mediante Prisma 7.10.1.

El esquema conserva los nueve modelos, relaciones, claves foráneas, enums,
restricciones de unicidad, valores `Decimal`, trazabilidad y reglas de cálculo
del inventario. No se ejecutaron migraciones ni se creó la base de datos.

Con el generador `prisma-client-js` actual no se requiere un adaptador adicional
para validar el esquema. La conexión real se configurará mediante
`DATABASE_URL` cuando se conozca la contraseña MySQL.
