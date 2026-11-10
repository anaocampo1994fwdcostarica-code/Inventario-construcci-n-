# Guía de instalación

Requiere Node.js 24, MySQL 8, Git y PowerShell.

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Configurar `.env` localmente con `PORT=3000`, `NODE_ENV=development`, `FRONTEND_ORIGIN=http://localhost:5173` y una `DATABASE_URL` MySQL real. Crear una base vacía y ejecutar:

```powershell
npx prisma migrate deploy
npm run prisma:validate
```

Para una instalación nueva y vacía, crear el primer administrador con autorización mediante `npm run auth:init-admin`. No usarlo si ya existen usuarios.

```powershell
cd ..\frontend
npm install
Copy-Item .env.example .env
npm run dev
```

En otra terminal iniciar el backend con `npm run dev`. Abrir `http://localhost:5173` y verificar `http://localhost:3000/api/health`.
