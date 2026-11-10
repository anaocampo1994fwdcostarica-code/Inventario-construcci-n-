# Etapa 23 — QA integral

## Alcance y aislamiento

Las pruebas con escritura se ejecutaron exclusivamente contra `gestion_inventario_construccion_test`. La base de desarrollo se consultó únicamente en modo lectura y conserva un usuario administrador y cero registros operativos.

Se verificaron migraciones, conexión MySQL, Prisma Validate, backend Express, frontend Vite y los scripts de integración existentes.

## Resultados automatizados

- Prisma Validate: exitoso.
- Pruebas unitarias backend: 49 exitosas, 1 omitida.
- Integración inventario/concurrencia: exitosa.
- Integración de recepciones/idempotencia: exitosa.
- Integración de autenticación: exitosa.
- Integración del inicializador temporal: exitosa y con limpieza.
- Frontend lint: exitoso.
- Frontend build: exitoso.

Los rechazos de stock insuficiente, claves de idempotencia repetidas y sobre-recepción son resultados esperados y comprobados por las pruebas.

## Cobertura funcional comprobada

Los scripts existentes cubren catálogos, movimientos, stock calculado, traslados, concurrencia, órdenes, recepciones parciales/completas, idempotencia, alertas, duplicidad de compras, login, logout, sesiones y restricciones administrativas básicas.

La matriz del backend conserva:

- `ADMINISTRADOR`: administración completa.
- `ENCARGADO_BODEGA`: operaciones de inventario, órdenes y recepciones autorizadas.
- `SUPERVISOR_OBRA`: operaciones de inventario, órdenes y recepciones autorizadas.
- `CONSULTA`: lectura; no puede escribir movimientos, compras, recepciones, usuarios ni estados administrativos.

## Seguridad

Se verificaron Argon2id, cookies HttpOnly, CSRF, CORS con credenciales, revocación de sesión, identidad del responsable desde la sesión y aislamiento de la base de pruebas. No se usaron credenciales del administrador real en pruebas automatizadas.

## E2E y revisión visual

No existe Playwright ni otro runner E2E configurado y no se descargaron navegadores. Por tanto, no se declaran pruebas visuales automatizadas. La revisión de código confirma rutas protegidas, navegación de login, estados de carga, errores y menú condicionado por rol. Debe realizarse una pasada manual en desktop, tablet y móvil antes de la demostración.

## Defectos y riesgos

- No se encontraron defectos críticos durante las pruebas automatizadas.
- Vite informa un chunk JavaScript superior a 500 KB; es una advertencia de optimización, no un fallo funcional.
- El rate limit de login está en memoria y debe centralizarse para múltiples instancias.
- La cobertura directa de casos de supervisor, consulta, usuario inactivo, sesión expirada y CSRF específico debe ampliarse antes de declarar cobertura de seguridad completa.
- No hay pruebas E2E de navegador ni capturas de evidencia generadas.

## Estado para entrega

ObraStock está funcional para una demostración académica controlada, con las limitaciones indicadas. Se recomienda ejecutar pruebas manuales de navegación y registrar capturas sin incluir contraseñas, cookies, tokens ni cadenas de conexión.
