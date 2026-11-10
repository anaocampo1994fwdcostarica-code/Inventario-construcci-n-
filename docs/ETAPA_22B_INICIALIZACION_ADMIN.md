# Etapa 22B-1 — Inicializador del primer administrador

## Arquitectura

El comando `npm run auth:init-admin` es local y separado del servidor. Solicita identificación, nombre, correo y contraseña mediante entrada interactiva; la contraseña y su confirmación no se muestran ni se pasan como argumentos.

El inicializador solo acepta exactamente `gestion_inventario_construccion_test`. Rechaza desarrollo y cualquier base desconocida antes de abrir una operación de escritura. También exige escribir el nombre de la base para confirmar.

## Reglas de seguridad

- Solo se permite inicializar cuando `Usuario` no contiene registros.
- El rol se fija internamente en `ADMINISTRADOR`.
- La cuenta se crea activa.
- La contraseña exige 12 caracteres, mayúscula, minúscula, número y símbolo.
- El hash se genera con Argon2id.
- No se imprimen contraseñas, hashes, tokens ni URLs.
- No existe endpoint público ni inicialización automática al arrancar Express.

## Concurrencia

Se usa `GET_LOCK('inventario:auth:first-admin', 10)` mediante una conexión MySQL dedicada. La comprobación de usuarios y la creación ocurren mientras el bloqueo está retenido; `RELEASE_LOCK` y el cierre de conexión se ejecutan en `finally`. Las pruebas concurrentes produjeron un único ganador.

## Comandos

```bash
npm run auth:init-admin
npm run test:integration:auth:init
```

El primer comando no se ejecutó en esta etapa. El segundo usa exclusivamente `gestion_inventario_construccion_test`, crea datos temporales y los elimina al finalizar.

## Resultado de pruebas

- Inicialización en base vacía: exitosa.
- Hash Argon2id y login: exitosos.
- Segundo intento: rechazado.
- Contraseña débil y confirmación distinta: rechazadas.
- Desarrollo y base desconocida: rechazadas.
- Concurrencia: un único administrador creado.
- Limpieza temporal: exitosa.
- Prisma Validate: exitoso.
- Backend: 49 pruebas exitosas y 1 omitida.
- Integraciones generales, recepciones y autenticación: exitosas.
- Frontend lint y build: exitosos.

## Etapa 22B-2

Para desarrollo se requiere una autorización posterior. El inicializador conserva el modo de pruebas por defecto. La habilitación preparada requiere ejecutar explícitamente `node scripts/init-admin.js --development`, confirmar el nombre exacto `gestion_inventario_construccion` y escribir `CREAR PRIMER ADMINISTRADOR EN DESARROLLO`. No se usa `NODE_ENV` como autorización. Antes de ejecutarlo se debe revisar que desarrollo siga sin usuarios y confirmar migraciones al día. Nunca se deben usar contraseñas predeterminadas ni ejecutar seeds.

La base de desarrollo permanece con cero usuarios al finalizar esta etapa.

## Riesgos pendientes

El límite de intentos de login continúa siendo local a la instancia del proceso. Para múltiples instancias deberá centralizarse. En producción también se requiere HTTPS y cookies `Secure`.
