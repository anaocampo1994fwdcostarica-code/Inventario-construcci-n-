# ObraStock

Sistema académico de gestión de inventarios para una empresa constructora.

## Tecnologías

React, Vite, Axios, React Router, Recharts, Lucide React, Node.js 24, Express 5, MySQL 8, Prisma 7.10.1, Vitest y Supertest.

## Instalación reproducible

Requisitos: Node.js 24, MySQL 8, Git y PowerShell.

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Configura en `backend/.env` una `DATABASE_URL` MySQL real, además de `PORT=3000`, `NODE_ENV=development` y `FRONTEND_ORIGIN=http://localhost:5173`. Crea una base vacía con el nombre indicado en la URL y aplica las migraciones:

```powershell
npx prisma migrate deploy
npm run prisma:validate
```

Instala el frontend:

```powershell
cd ..\frontend
npm install
Copy-Item .env.example .env
```

El archivo `frontend/.env` debe usar `VITE_API_URL=http://localhost:3000/api`.

## Datos semilla de demostración

El seed está pensado para una base aislada, preferiblemente `gestion_inventario_construccion_test`. Es idempotente, usa IDs deterministas, no sobrescribe registros existentes y exige una contraseña local para generar el hash Argon2id. Nunca hay contraseñas predeterminadas ni contraseñas en el repositorio.

```powershell
cd backend
$env:SEED_DATABASE_NAME="gestion_inventario_construccion_test"
$env:SEED_ADMIN_PASSWORD="definir-localmente-una-clave-segura"
npm run seed
Remove-Item Env:SEED_ADMIN_PASSWORD
Remove-Item Env:SEED_DATABASE_NAME
```

El script rechaza la base de desarrollo `gestion_inventario_construccion`, salvo que se proporcione una autorización explícita mediante `SEED_ALLOW_DEVELOPMENT=YES`. No se debe usar esa excepción sobre una base operativa.

## Ejecución

Terminal 1:

```powershell
cd backend
npm run dev
```

Terminal 2:

```powershell
cd frontend
npm run dev
```

Abrir `http://localhost:5173`. La API queda en `http://localhost:3000`.

## Pruebas

```powershell
cd backend
npm run prisma:validate
npm test
npm run test:integration
npm run test:integration:receipts
npm run test:integration:auth
npm run test:integration:auth:init

cd ..\frontend
npm run lint
npm run build
```

Las pruebas con escritura y el seed deben usar exclusivamente una base aislada. No ejecutar operaciones de demostración sobre producción.

## Módulos y roles

Incluye dashboard, materiales, ubicaciones, proveedores, usuarios, movimientos, órdenes de compra, recepciones, alertas y reportes.

- `ADMINISTRADOR`: administración completa.
- `ENCARGADO_BODEGA`: operaciones autorizadas de inventario y compras.
- `SUPERVISOR_OBRA`: operaciones operativas autorizadas.
- `CONSULTA`: solo lectura.

Una orden aprobada no aumenta existencias; el stock aumenta al registrar una recepción válida.

## Documentación

- [Guía de instalación](docs/GUIA_INSTALACION.md)
- [Manual de usuario](docs/MANUAL_USUARIO.md)
- [Guía de demostración](docs/GUIA_DEMOSTRACION.md)
- [Checklist](docs/CHECKLIST_DEMOSTRACION.md)
- [Informe final](docs/INFORME_ENTREGA_FINAL.md)

Limitaciones conocidas: no hay suite E2E de navegador; la revisión visual final es manual. Vite puede mostrar una advertencia de tamaño de bundle y el límite de intentos de login es local al proceso.
