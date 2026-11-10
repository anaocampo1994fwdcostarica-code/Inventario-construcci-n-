# Informe de entrega final

## Resumen

ObraStock implementa inventario para una empresa constructora con React,
Express, Prisma y MySQL.

## Implementación

Incluye catálogos, stock calculado por movimientos, órdenes, recepciones
idempotentes, alertas, reportes, autenticación Argon2id, sesiones HttpOnly y
autorización por roles.

## Datos reproducibles

`backend/scripts/seed.js` crea datos ficticios de demostración en una base
aislada. Usa IDs deterministas, una transacción y una contraseña introducida
localmente mediante `SEED_ADMIN_PASSWORD`; no contiene credenciales ni datos
reales.

## Validaciones

- Backend: 49 pruebas aprobadas y 1 omitida.
- Integraciones de inventario, recepciones, autenticación e inicializador: aprobadas en sus etapas correspondientes.
- Prisma Validate: aprobado.
- Frontend lint y build: aprobados.

## Evidencias y pendientes

No existe suite E2E de navegador ni capturas automatizadas. Deben tomarse
manualmente en `docs/evidencias/entrega_final/`, sin exponer secretos, y
completar el checklist visual. El enunciado o rúbrica oficial del Quiz #2 no se
encuentra en el repositorio, por lo que la Parte A requiere validación contra el
documento oficial del curso.

**Estado:** aplicación técnica operativa, con evidencias académicas pendientes.
