# Auditoría académica final — Quiz #2 ObraStock

Fecha de auditoría: 2026-11-09. Esta revisión es de solo lectura sobre código,
documentación, procesos locales y consultas SQL. La puntuación es una estimación
técnica; la nota definitiva corresponde al docente.

## Resumen ejecutivo

ObraStock implementa una solución amplia para inventario de construcción: catálogo,
ubicaciones, proveedores, compras, recepciones trazables, movimientos, stock
calculado, reorden, alertas, autenticación con roles y reportes. La base demo
aislada contiene datos reales para una demostración. La mayor exposición académica
no está en el modelo de datos, sino en la preparación de entrega: cambios locales
sin consolidar, README desactualizado para el flujo demo, validación visual/E2E no
realizada y ausencia de evidencia de video o presentación.

## Estado de entregables

| Entregable | Estado | Evidencia / observación |
|---|---|---|
| Informe PDF | Cumple con observaciones | Existe, 51 508 bytes y 7 marcadores de página; no contiene texto `mermaid` detectable. La legibilidad visual no fue verificada con renderer. |
| Informe DOCX | Cumple con observaciones | Existe en `entrega_final/`; consistencia visual con PDF no verificada en esta auditoría. |
| Repositorio | Parcial | Migraciones, seed, `.env.example`, README y documentación existen. Hay cambios locales sin commit y README no refleja por completo el flujo demo actual. |
| Video de 5 minutos | Pendiente | No se encontró archivo ni guion cronometrado de 5 minutos. La guía existente indica 10–15 minutos. |
| Presentación de 10 minutos | Pendiente | No se encontró presentación o guion específico. |

## Matriz de evaluación (100 puntos)

| Criterio | Máximo | Estado | Evidencia | Problemas detectados | Estimado | Acción necesaria |
|---|---:|---|---|---|---:|---|
| A1 — Circuito y aprobación | 8 | Cumplido | `QUIZ2_PARTE_A.md`: flujo, responsables, documentos, matriz y fraccionamiento. | Diagrama Mermaid no se comprobó como visual dentro del PDF. | 8 | Verificar el diagrama renderizado en PDF. |
| A2 — Categorías de gasto | 8 | Parcial | Taxonomía, reclasificación y ahorros ₡30 000 / ₡62 000 / ₡27 000 documentados. | Equivalencias técnicas condicionadas, no comprobadas. | 7 | Mantener explícitos los supuestos y, si aplica, adjuntar fichas. |
| A3 — Análisis de gasto | 10 | Cumplido | Sobreprecio mensual ₡223 000, anual ₡2 676 000 y escenario OC-1042 ₡1 453 000 sin doble conteo. | Duplicidades siguen siendo escenarios, no hechos confirmados. | 10 | Explicarlo igual durante la defensa. |
| A4 — Proveedores | 7 | Cumplido | Tres proveedores, pesos 100 %, B/C = 3,85 y recomendación razonada. | Calificaciones declaradas como supuestos académicos. | 7 | Indicarlo en exposición. |
| A5 — Reorden | 7 | Cumplido | SS y PR: cemento 45/165, varilla 200/800, block 1200/3600, arena 8/20. | Sin observación material. | 7 | Mostrar relación con módulo de reorden. |
| B1 — Funcionalidad | 20 | Parcial alto | Frontend/API para catálogos, usuarios, movimientos, compras, recepciones, alertas, reportes y roles. Demo: 12 materiales, 3 ubicaciones, 5 proveedores, 8 OC, 1 recepción, 15 movimientos, 1 alerta. | No hubo prueba E2E visual completa; alerta y algunos diseños requieren revisión manual. | 17 | Ejecutar demo completa autenticada y registrar evidencia. |
| B2 — Datos y modelo | 12 | Cumplido alto | 13 modelos/tablas incl. sesiones; claves, únicos, FK restrictivas, migraciones y trazabilidad. | Diagrama ER visual no se verificó contra el PDF en esta revisión. | 11 | Comparar diagrama final con `schema.prisma`. |
| B3 — Lógica de negocio | 12 | Cumplido alto | Transacciones, GET_LOCK, stock por movimientos, validaciones de cantidad, recepción idempotente, reorden, alertas y duplicados 10 %/7 días. | Parámetros de duplicidad están fijados en código; falta prueba E2E visual de concurrencia. | 11 | Documentar configurabilidad futura y ejecutar integración aislada antes de entrega. |
| B4 — Calidad técnica | 8 | Parcial | Arquitectura por rutas/controladores/servicios, Prisma, manejo de errores, Argon2id, roles, `.gitignore`, pruebas y migraciones. | README describe seed antiguo; cambios sin commit; build/test recientes afectados por memoria local. | 5 | Actualizar README y consolidar cambios tras revisión. |
| B5 — Presentación/demo | 8 | Parcial | Demo MySQL aislada y backend demo operativo; frontend y API locales disponibles. | No video, no presentación, no E2E visual final y diseño Stitch aún requiere pasada visual. | 5 | Preparar video, presentación y checklist de recorrido. |
| **Total** | **100** | **Estimación** |  |  | **88** | Priorizar cierre de entrega. |

## Evidencia técnica

### Base demo y aislamiento

Consultas SQL de solo lectura verificaron:

| Base | Usuarios | Materiales | Ubicaciones | Proveedores | OC | Recepciones | Movimientos | Alertas |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `gestion_inventario_construccion` | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `gestion_inventario_construccion_demo` | 2 | 12 | 3 | 5 | 8 | 1 | 15 | 1 |

La demo contiene las tres migraciones versionadas. Los puertos locales detectados
fueron 3000 (backend original), 3101 (backend demo) y 5173 (frontend). Esta
coexistencia requiere documentarse y demostrarse con cuidado.

### Datos, trazabilidad y concurrencia

- `schema.prisma` modela usuario, sesión, material, ubicación, proveedor, orden y
  detalle, movimiento, recepción y detalle, alerta y auditoría.
- El stock se calcula desde movimientos; no se conserva como campo editable.
- Recepciones usan clave de idempotencia y hash de solicitud.
- Los movimientos y recepciones usan transacciones y locks MySQL por material u orden.
- La detección de compras duplicadas aplica proveedor/material coincidente,
  tolerancia de cantidad de 10 % y ventana de 7 días.

### Seguridad y permisos

Autenticación basada en Argon2id, cookie `HttpOnly`, token CSRF y sesiones
persistidas. Los permisos se validan en backend: `ADMINISTRADOR`,
`ENCARGADO_BODEGA`, `SUPERVISOR_OBRA` y `CONSULTA`. No se auditaron contraseñas,
hashes ni tokens.

## Diseño Stitch

Se incorporaron tokens, sidebar, header, tarjetas, tablas, formularios, login,
reportes y estilos responsive. El dashboard usa datos reales y la alerta crítica
usa alertas activas de la API. Pendiente: pasada visual manual de todas las
pantallas, en especial Alertas y las resoluciones 1920, 1440, 1280, 1024 y 768.

## Riesgos priorizados

| Severidad | Hallazgo | Impacto | Acción |
|---|---|---|---|
| Crítico | Ningún bloqueo de base de datos identificado. | — | Mantener la base original aislada. |
| Alto | README no refleja completamente cuentas demo, doble contraseña ni backend demo 3101. | Instalación/demostración no reproducible para evaluador. | Actualizar tras esta auditoría. |
| Alto | Video de máximo 5 minutos y presentación de 10 minutos no evidenciados. | Puede perder puntos de entrega/presentación. | Crear guiones y grabación. |
| Medio | Cambios locales sin commit. | Repositorio no está listo para entregar. | Revisar, validar, commit local y publicar solo con autorización. |
| Medio | Build y pruebas recientes agotaron memoria con servicios activos. | Falta evidencia final de validación. | Detener procesos no necesarios o ejecutar en entorno con más memoria. |
| Medio | Comparación visual/E2E no automatizada. | Riesgo de fallos en la demostración. | Ejecutar checklist manual y capturas. |
| Bajo | Parámetros de duplicidad están codificados. | Menor flexibilidad administrativa. | Documentar como decisión académica o parametrizar después de entrega. |

## Plan de cierre

1. **Actualizar documentación de ejecución demo** — README y guía de instalación.
   Beneficia B4/B5; verificar con una instalación limpia no destructiva.
2. **Cerrar validación técnica** — detener procesos redundantes y ejecutar Prisma,
   tests, lint y build secuencialmente. Beneficia B1/B4.
3. **Prueba manual demo** — login demo, material, movimiento, recepción, alerta,
   reporte, logout y permiso de empleado. Beneficia B1/B5.
4. **Verificar PDF y DOCX visualmente** — portada, diagramas, tablas y caracteres.
   Beneficia A1 y entregable PDF.
5. **Preparar presentación y video** — video: 0:00 problema, 0:35 login,
   1:00 catálogos, 1:45 movimiento/stock, 2:40 OC/recepción, 3:30 alerta/reorden,
   4:15 reportes, 4:45 cierre. Para clase: 2 min problema, 2 min modelo, 4 min demo,
   2 min aprendizajes.
6. **Revisión Git final** — añadir solo código/documentación seguros, excluir `.env`,
   `node_modules`, dist y respaldos; después crear commit solo con autorización.

## Limitaciones de auditoría

- No se proporcionó el enunciado completo fuera de la documentación interna.
- No hubo navegador automatizado ni renderer PDF/DOCX para inspección visual final.
- No se ejecutaron escrituras, seed, migraciones ni pruebas de integración contra la
  base protegida.
- Las pruebas backend y build tuvieron ejecuciones previas exitosas, pero el último
  intento concurrente falló por agotamiento de memoria local; no se interpreta como
  evidencia de fallo funcional sin una repetición aislada.
