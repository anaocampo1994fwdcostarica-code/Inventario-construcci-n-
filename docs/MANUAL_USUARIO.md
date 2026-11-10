# Manual de usuario

En `/login`, acceder con correo o identificación. La sesión se mantiene mediante cookie segura y se revoca con “Salir”.

- Dashboard: resumen de existencias, movimientos y alertas.
- Materiales: parámetros de stock y demanda.
- Ubicaciones: bodegas y obras.
- Proveedores: datos de proveedores.
- Usuarios: responsables; solo administrador.
- Movimientos: entradas, salidas, traslados y ajustes.
- Órdenes de compra: creación, estados y detalles.
- Recepciones: material recibido contra una orden.
- Alertas: reposición y evaluación.
- Reportes: filtros, gráficos y CSV.

Una orden aprobada no aumenta existencias. El stock aumenta únicamente al registrar una recepción válida.

`ADMINISTRADOR` tiene acceso completo; `ENCARGADO_BODEGA` y `SUPERVISOR_OBRA` tienen permisos operativos; `CONSULTA` solo puede leer.
