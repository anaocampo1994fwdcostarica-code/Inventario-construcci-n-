# Entorno demo de ObraStock

La demostración utiliza la base MySQL independiente `gestion_inventario_construccion_demo`.
La base normal `gestion_inventario_construccion` no debe usarse para cargar datos demo.

El seed prepara 12 materiales, 3 ubicaciones, 5 proveedores, 8 órdenes de compra,
recepciones trazables, 15 movimientos o más y escenarios de existencias suficientes,
bajas y agotadas. Los registros usan IDs deterministas y pueden crearse de forma
idempotente sin duplicar los datos del seed.

## Preparación

Desde PowerShell, en `backend`, configure las variables únicamente en la sesión local:

```powershell
$env:DEMO_DATABASE_URL = 'mysql://ana:<CONTRASENA_URL_ENCODED>@localhost:3306/gestion_inventario_construccion_demo'
$env:DATABASE_URL = $env:DEMO_DATABASE_URL
$env:SEED_DATABASE_NAME = 'gestion_inventario_construccion_demo'
$env:SEED_ADMIN_PASSWORD = '<clave-local-del-administrador>'
$env:SEED_EMPLOYEE_PASSWORD = '<clave-local-del-empleado>'
```

Las dos claves deben tener al menos 12 caracteres, ser diferentes y no deben escribirse en el repositorio, README, historial de comandos ni chat.

## Migraciones y seed

La base demo se crea y migra de forma independiente:

```powershell
npx prisma migrate deploy
npm run seed
```

El seed es idempotente y utiliza IDs deterministas. Si se ejecuta otra vez, no duplica los registros creados por el seed. Se detiene si falta alguna contraseña o si la base confirmada no coincide con la URL.

## Cuentas demo

| Cuenta | Correo | Rol |
|---|---|---|
| Administrador demo | admin@inventario.test | ADMINISTRADOR |
| Empleado demo | empleado@obrastock.test | ENCARGADO_BODEGA |

Ambas cuentas utilizan el mismo login `/login`. El empleado conserva las restricciones de backend y no puede administrar usuarios ni ejecutar operaciones reservadas al administrador.

## Inicio de la aplicación

Con `DATABASE_URL` apuntando a la demo:

```powershell
cd backend
npm run dev
```

En otra terminal:

```powershell
cd frontend
npm run dev
```

El frontend debe usar `VITE_API_URL=http://localhost:3000/api`. Para volver al entorno normal, cierre las terminales y establezca nuevamente `DATABASE_URL` desde `backend/.env`; no copie la URL demo sobre ese archivo.

Si el backend normal ya ocupa el puerto 3000, inicie la demo en el puerto 3101 sin detenerlo:

```powershell
powershell -ExecutionPolicy Bypass -File .\backend\scripts\iniciar-backend-demo.ps1
```

En una segunda terminal, inicie Vite apuntando al backend demo:

```powershell
cd frontend
$env:VITE_API_URL = 'http://localhost:3101/api'
npm run dev
```

Abra la URL indicada por Vite, cierre cualquier sesión anterior e inicie sesión con una de las cuentas demo. La variable `VITE_API_URL` vive solo en esa terminal y no modifica archivos locales.

## Verificación de aislamiento

Compruebe el destino antes de migrar o ejecutar el seed:

```powershell
node -e "console.log(new URL(process.env.DATABASE_URL).pathname)"
```

El resultado esperado contiene únicamente `/gestion_inventario_construccion_demo`. Nunca ejecute el seed contra `gestion_inventario_construccion`.

## Problemas frecuentes

- `SEED_DATABASE_NAME` debe coincidir exactamente con el nombre de la base en `DATABASE_URL`.
- Las contraseñas deben configurarse en cada sesión nueva de PowerShell.
- Si la URL contiene caracteres especiales, deben estar codificados como URL.
- No se incluyen contraseñas ni archivos `.env` en Git.
