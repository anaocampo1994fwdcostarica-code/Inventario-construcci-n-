import 'dotenv/config'
import argon2 from 'argon2'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

const databaseUrl = new URL(process.env.DATABASE_URL || '')
const databaseName = databaseUrl.pathname.replace(/^\//, '')
const confirmedDatabase = process.env.SEED_DATABASE_NAME

if (!databaseName || confirmedDatabase !== databaseName) {
  throw new Error('Define SEED_DATABASE_NAME con el nombre exacto de la base antes de ejecutar el seed')
}

if (databaseName === 'gestion_inventario_construccion' && process.env.SEED_ALLOW_DEVELOPMENT !== 'YES') {
  throw new Error('El seed está bloqueado para la base de desarrollo; use una base aislada o confirme SEED_ALLOW_DEVELOPMENT=YES')
}

const adminPassword = process.env.SEED_ADMIN_PASSWORD
const employeePassword = process.env.SEED_EMPLOYEE_PASSWORD
if (!adminPassword || adminPassword.length < 12 || !employeePassword || employeePassword.length < 12) {
  throw new Error('SEED_ADMIN_PASSWORD y SEED_EMPLOYEE_PASSWORD son obligatorios y deben tener al menos 12 caracteres; nunca se usan contraseñas predeterminadas')
}
if (adminPassword === employeePassword) throw new Error('Las contraseñas demo deben ser independientes')

const adapter = new PrismaMariaDb({
  host: databaseUrl.hostname,
  port: Number(databaseUrl.port || 3306),
  user: decodeURIComponent(databaseUrl.username),
  password: decodeURIComponent(databaseUrl.password),
  database: databaseName,
  connectionLimit: 3,
})
const prisma = new PrismaClient({ adapter })

const ids = {
  admin: 'seed-usuario-admin',
  cemento: 'seed-material-cemento',
  varilla: 'seed-material-varilla',
  block: 'seed-material-block',
  arena: 'seed-material-arena',
  pvc: 'seed-material-pvc',
  guantes: 'seed-material-guantes',
  central: 'seed-ubicacion-central',
  norte: 'seed-ubicacion-norte',
  sur: 'seed-ubicacion-sur',
  provA: 'seed-proveedor-a',
  provB: 'seed-proveedor-b',
  provC: 'seed-proveedor-c',
  orden1: 'seed-orden-001',
  orden2: 'seed-orden-002',
  detalleCemento1: 'seed-detalle-cemento-001',
  detalleArena1: 'seed-detalle-arena-001',
  detalleCemento2: 'seed-detalle-cemento-002',
  recepcion: 'seed-recepcion-001',
  detalleRecepcion: 'seed-detalle-recepcion-001',
  entradaCemento: 'seed-movimiento-entrada-cemento',
  salidaCemento: 'seed-movimiento-salida-cemento',
  trasladoBlock: 'seed-movimiento-traslado-block',
  entradaArena: 'seed-movimiento-entrada-arena',
  entradaPvc: 'seed-movimiento-entrada-pvc',
  ajusteBlock: 'seed-movimiento-ajuste-block',
  piedra: 'seed-material-piedra', pintura: 'seed-material-pintura', cable: 'seed-material-cable', tornillos: 'seed-material-tornillos', lamina: 'seed-material-lamina', adhesivo: 'seed-material-adhesivo',
  provD: 'seed-proveedor-d', provE: 'seed-proveedor-e', orden3: 'seed-orden-003', orden4: 'seed-orden-004', orden5: 'seed-orden-005', orden6: 'seed-orden-006', orden7: 'seed-orden-007', orden8: 'seed-orden-008',
  detallePiedra: 'seed-detalle-piedra-003', detallePvc: 'seed-detalle-pvc-004', detallePintura: 'seed-detalle-pintura-005', detalleCable: 'seed-detalle-cable-006', detalleTornillos: 'seed-detalle-tornillos-007', detalleLamina: 'seed-detalle-lamina-008',
  movimientoPiedra: 'seed-movimiento-piedra', movimientoPvc: 'seed-movimiento-pvc-medio', movimientoPintura: 'seed-movimiento-pintura', movimientoCable: 'seed-movimiento-cable', movimientoTornillos: 'seed-movimiento-tornillos', movimientoLamina: 'seed-movimiento-lamina', movimientoAdhesivo: 'seed-movimiento-adhesivo', movimientoVarilla: 'seed-movimiento-varilla', movimientoArenaSalida: 'seed-movimiento-arena-salida',
  alertaGuantes: 'seed-alerta-guantes',
  auditoria: 'seed-auditoria-001',
}

const ensure = async (tx, model, id, data) => {
  const current = await tx[model].findUnique({ where: { id } })
  return current || tx[model].create({ data: { id, ...data } })
}

const run = async () => {
  const adminPasswordHash = await argon2.hash(adminPassword, { type: argon2.argon2id })
  const employeePasswordHash = await argon2.hash(employeePassword, { type: argon2.argon2id })

  await prisma.$transaction(async (tx) => {
    const admin = await ensure(tx, 'usuario', ids.admin, {
      identificacion: 'SEED-ADMIN',
      nombre: 'Administrador de Demostración',
      correo: 'admin@inventario.test',
      rol: 'ADMINISTRADOR',
      passwordHash: adminPasswordHash,
    })
    await ensure(tx, 'usuario', 'seed-usuario-empleado', {
      identificacion: 'DEMO-BODEGA',
      nombre: 'Empleado de Demostración',
      correo: 'empleado@obrastock.test',
      rol: 'ENCARGADO_BODEGA',
      passwordHash: employeePasswordHash,
    })

    const materials = {}
    materials.piedra = await ensure(tx, 'material', ids.piedra, { codigo: 'MAT-PIE-01', nombre: 'Piedra cuarta', descripcion: 'Agregado para concreto', unidadMedida: 'm3', stockMinimo: 10, stockMaximo: 80, demandaDiariaPromedio: 3, demandaDiariaMaxima: 6, tiempoEntregaDias: 4 })
    materials.pintura = await ensure(tx, 'material', ids.pintura, { codigo: 'MAT-PIN-BLA', nombre: 'Pintura blanca', descripcion: 'Pintura base agua', unidadMedida: 'galon', stockMinimo: 8, stockMaximo: 40, demandaDiariaPromedio: 1, demandaDiariaMaxima: 3, tiempoEntregaDias: 5 })
    materials.cable = await ensure(tx, 'material', ids.cable, { codigo: 'MAT-CAB-12', nombre: 'Cable electrico', descripcion: 'Cable para instalaciones residenciales', unidadMedida: 'metro', stockMinimo: 100, stockMaximo: 800, demandaDiariaPromedio: 25, demandaDiariaMaxima: 45, tiempoEntregaDias: 6 })
    materials.tornillos = await ensure(tx, 'material', ids.tornillos, { codigo: 'MAT-TOR-001', nombre: 'Tornillos de construccion', descripcion: 'Tornillos galvanizados', unidadMedida: 'caja', stockMinimo: 10, stockMaximo: 80, demandaDiariaPromedio: 2, demandaDiariaMaxima: 4, tiempoEntregaDias: 4 })
    materials.lamina = await ensure(tx, 'material', ids.lamina, { codigo: 'MAT-LAM-ZIN', nombre: 'Lamina de zinc', descripcion: 'Lamina para cubierta', unidadMedida: 'unidad', stockMinimo: 15, stockMaximo: 100, demandaDiariaPromedio: 3, demandaDiariaMaxima: 6, tiempoEntregaDias: 7 })
    materials.adhesivo = await ensure(tx, 'material', ids.adhesivo, { codigo: 'MAT-ADH-CER', nombre: 'Adhesivo ceramico', descripcion: 'Adhesivo para revestimientos', unidadMedida: 'saco', stockMinimo: 10, stockMaximo: 60, demandaDiariaPromedio: 2, demandaDiariaMaxima: 4, tiempoEntregaDias: 5 })
    materials.cemento = await ensure(tx, 'material', ids.cemento, { codigo: 'MAT-CEM-50', nombre: 'Cemento gris 50 kg', descripcion: 'Cemento para concreto estructural', unidadMedida: 'saco', stockMinimo: 20, stockMaximo: 120, demandaDiariaPromedio: 10, demandaDiariaMaxima: 18, tiempoEntregaDias: 3 })
    materials.varilla = await ensure(tx, 'material', ids.varilla, { codigo: 'MAT-VAR-3', nombre: 'Varilla #3', descripcion: 'Varilla corrugada de construcción', unidadMedida: 'unidad', stockMinimo: 30, stockMaximo: 200, demandaDiariaPromedio: 8, demandaDiariaMaxima: 14, tiempoEntregaDias: 5 })
    materials.block = await ensure(tx, 'material', ids.block, { codigo: 'MAT-BLK-122040', nombre: 'Block 12 x 20 x 40', descripcion: 'Block de concreto', unidadMedida: 'unidad', stockMinimo: 50, stockMaximo: 500, demandaDiariaPromedio: 20, demandaDiariaMaxima: 35, tiempoEntregaDias: 4 })
    materials.arena = await ensure(tx, 'material', ids.arena, { codigo: 'MAT-ARENA', nombre: 'Arena', descripcion: 'Arena para mezcla', unidadMedida: 'm3', stockMinimo: 15, stockMaximo: 100, demandaDiariaPromedio: 5, demandaDiariaMaxima: 8, tiempoEntregaDias: 4 })
    materials.pvc = await ensure(tx, 'material', ids.pvc, { codigo: 'MAT-PVC-110', nombre: 'Tubo PVC 110 mm', descripcion: 'Tubería PVC sanitaria', unidadMedida: 'unidad', stockMinimo: 10, stockMaximo: 60, demandaDiariaPromedio: 2, demandaDiariaMaxima: 4, tiempoEntregaDias: 7 })
    materials.guantes = await ensure(tx, 'material', ids.guantes, { codigo: 'MAT-GUA-SEG', nombre: 'Guantes de seguridad', descripcion: 'Equipo de protección personal', unidadMedida: 'par', stockMinimo: 25, stockMaximo: 150, demandaDiariaPromedio: 6, demandaDiariaMaxima: 10, tiempoEntregaDias: 3 })

    const central = await ensure(tx, 'ubicacion', ids.central, { codigo: 'BOD-CENTRAL', nombre: 'Bodega Central', tipo: 'BODEGA', direccion: 'San José, Costa Rica' })
    const norte = await ensure(tx, 'ubicacion', ids.norte, { codigo: 'OBR-NORTE', nombre: 'Obra Norte', tipo: 'OBRA', direccion: 'Heredia, Costa Rica' })
    const sur = await ensure(tx, 'ubicacion', ids.sur, { codigo: 'OBR-SUR', nombre: 'Obra Sur', tipo: 'OBRA', direccion: 'Cartago, Costa Rica' })

    const proveedorA = await ensure(tx, 'proveedor', ids.provA, { identificacion: 'SEED-PROV-A', nombre: 'Materiales Ticos A', correo: 'ventas.a@obrastock.local', telefono: '2222-1001', direccion: 'San José, Costa Rica' })
    await ensure(tx, 'proveedor', ids.provB, { identificacion: 'SEED-PROV-B', nombre: 'Suministros Constructivos B', correo: 'ventas.b@obrastock.local', telefono: '2222-1002', direccion: 'Alajuela, Costa Rica' })
    await ensure(tx, 'proveedor', ids.provC, { identificacion: 'SEED-PROV-C', nombre: 'Ferretería Nacional C', correo: 'ventas.c@obrastock.local', telefono: '2222-1003', direccion: 'Cartago, Costa Rica' })

    const proveedorD = await ensure(tx, 'proveedor', ids.provD, { identificacion: 'SEED-PROV-D', nombre: 'Proveedores Demo D', correo: 'ventas.d@obrastock.local', telefono: '2222-1004', direccion: 'Heredia, Costa Rica' })
    const proveedorE = await ensure(tx, 'proveedor', ids.provE, { identificacion: 'SEED-PROV-E', nombre: 'Suministros Demo E', correo: 'ventas.e@obrastock.local', telefono: '2222-1005', direccion: 'Puntarenas, Costa Rica' })

    const order1 = await ensure(tx, 'ordenCompra', ids.orden1, { numero: 'OC-SEED-001', proveedorId: proveedorA.id, fecha: new Date('2026-01-10T08:00:00Z'), estado: 'APROBADA', responsableId: admin.id, total: '1012.50', observaciones: 'Orden demostrativa principal' })
    const detailCemento1 = await ensure(tx, 'detalleOrdenCompra', ids.detalleCemento1, { ordenCompraId: order1.id, materialId: materials.cemento.id, cantidad: 100, precioUnitario: '8.50', subtotal: '850.00', cantidadRecibida: 60 })
    await ensure(tx, 'detalleOrdenCompra', ids.detalleArena1, { ordenCompraId: order1.id, materialId: materials.arena.id, cantidad: 50, precioUnitario: '3.25', subtotal: '162.50' })
    const order2 = await ensure(tx, 'ordenCompra', ids.orden2, { numero: 'OC-SEED-002', proveedorId: proveedorA.id, fecha: new Date('2026-01-13T08:00:00Z'), estado: 'SOLICITADA', responsableId: admin.id, total: '807.50', observaciones: 'Orden cercana para demostrar posible duplicidad' })
    await ensure(tx, 'detalleOrdenCompra', ids.detalleCemento2, { ordenCompraId: order2.id, materialId: materials.cemento.id, cantidad: 95, precioUnitario: '8.50', subtotal: '807.50' })
    const extraOrders = [
      [ids.orden3, 'OC-SEED-003', proveedorD.id, 'APROBADA', materials.piedra.id, ids.detallePiedra, 40, '12500.00', '500000.00'],
      [ids.orden4, 'OC-SEED-004', proveedorE.id, 'APROBADA', materials.pvc.id, ids.detallePvc, 80, '2800.00', '224000.00'],
      [ids.orden5, 'OC-SEED-005', proveedorD.id, 'BORRADOR', materials.pintura.id, ids.detallePintura, 25, '9500.00', '237500.00'],
      [ids.orden6, 'OC-SEED-006', proveedorE.id, 'SOLICITADA', materials.cable.id, ids.detalleCable, 500, '1100.00', '550000.00'],
      [ids.orden7, 'OC-SEED-007', proveedorA.id, 'APROBADA', materials.tornillos.id, ids.detalleTornillos, 40, '4200.00', '168000.00'],
      [ids.orden8, 'OC-SEED-008', proveedorD.id, 'CANCELADA', materials.lamina.id, ids.detalleLamina, 60, '7200.00', '432000.00'],
    ]
    for (const [id, numero, proveedorId, estado, materialId, detalleId, cantidad, precioUnitario, total] of extraOrders) {
      const order = await ensure(tx, 'ordenCompra', id, { numero, proveedorId, fecha: new Date('2026-01-18T08:00:00Z'), estado, responsableId: admin.id, total, observaciones: 'Orden de demostracion' })
      await ensure(tx, 'detalleOrdenCompra', detalleId, { ordenCompraId: order.id, materialId, cantidad, precioUnitario, subtotal: total })
    }

    const receipt = await ensure(tx, 'recepcionCompra', ids.recepcion, { ordenCompraId: order1.id, claveIdempotencia: 'seed-recepcion-001', solicitudHash: 'seed-recepcion-hash-001'.padEnd(64, '0'), usuarioId: admin.id, ubicacionId: central.id, referencia: 'FAC-SEED-001', observaciones: 'Recepción parcial demostrativa', fecha: new Date('2026-01-12T10:00:00Z') })
    const receiptDetail = await ensure(tx, 'detalleRecepcion', ids.detalleRecepcion, { recepcionId: receipt.id, detalleOrdenCompraId: detailCemento1.id, cantidad: 60 })
    await ensure(tx, 'movimientoInventario', ids.entradaCemento, { materialId: materials.cemento.id, tipo: 'ENTRADA', cantidad: 60, fecha: new Date('2026-01-12T10:00:00Z'), usuarioId: admin.id, ubicacionDestinoId: central.id, documentoOrigen: 'FAC-SEED-001', ordenCompraId: order1.id, detalleOrdenCompraId: detailCemento1.id, detalleRecepcionId: receiptDetail.id, recepcionCompraId: receipt.id, observaciones: 'Entrada trazable a recepción' })
    await ensure(tx, 'movimientoInventario', ids.salidaCemento, { materialId: materials.cemento.id, tipo: 'SALIDA', cantidad: 10, fecha: new Date('2026-01-14T10:00:00Z'), usuarioId: admin.id, ubicacionOrigenId: central.id, documentoOrigen: 'VALE-SEED-001', observaciones: 'Salida a cuadrilla' })
    await ensure(tx, 'movimientoInventario', ids.trasladoBlock, { materialId: materials.block.id, tipo: 'TRASLADO', cantidad: 30, fecha: new Date('2026-01-15T10:00:00Z'), usuarioId: admin.id, ubicacionOrigenId: central.id, ubicacionDestinoId: norte.id, documentoOrigen: 'TRAS-SEED-001', observaciones: 'Traslado a Obra Norte' })
    await ensure(tx, 'movimientoInventario', ids.entradaArena, { materialId: materials.arena.id, tipo: 'ENTRADA', cantidad: 50, fecha: new Date('2026-01-12T11:00:00Z'), usuarioId: admin.id, ubicacionDestinoId: central.id, documentoOrigen: 'FAC-SEED-002', observaciones: 'Entrada de arena' })
    await ensure(tx, 'movimientoInventario', ids.entradaPvc, { materialId: materials.pvc.id, tipo: 'ENTRADA', cantidad: 40, fecha: new Date('2026-01-13T11:00:00Z'), usuarioId: admin.id, ubicacionDestinoId: sur.id, documentoOrigen: 'FAC-SEED-003', observaciones: 'Entrada de tubería' })
    await ensure(tx, 'movimientoInventario', ids.ajusteBlock, { materialId: materials.block.id, tipo: 'AJUSTE', sentidoAjuste: 'INCREMENTO', cantidad: 5, fecha: new Date('2026-01-16T11:00:00Z'), usuarioId: admin.id, ubicacionDestinoId: central.id, documentoOrigen: 'AJU-SEED-001', observaciones: 'Ajuste positivo por conteo físico' })

    await ensure(tx, 'alertaInventario', ids.alertaGuantes, { materialId: materials.guantes.id, ubicacionId: central.id, tipo: 'PUNTO_REORDEN', estado: 'ACTIVA', descripcion: 'Stock de guantes en cero: requiere reposición', fecha: new Date('2026-01-16T12:00:00Z') })
    const extraMovements = [
      [ids.movimientoPiedra, materials.piedra.id, 'ENTRADA', 40, central.id, null, 'FAC-SEED-004'],
      [ids.movimientoPvc, materials.pvc.id, 'ENTRADA', 25, sur.id, null, 'FAC-SEED-005'],
      [ids.movimientoPintura, materials.pintura.id, 'ENTRADA', 25, central.id, null, 'FAC-SEED-006'],
      [ids.movimientoCable, materials.cable.id, 'ENTRADA', 500, central.id, null, 'FAC-SEED-007'],
      [ids.movimientoTornillos, materials.tornillos.id, 'ENTRADA', 40, central.id, null, 'FAC-SEED-008'],
      [ids.movimientoLamina, materials.lamina.id, 'ENTRADA', 60, norte.id, null, 'FAC-SEED-009'],
      [ids.movimientoAdhesivo, materials.adhesivo.id, 'ENTRADA', 8, central.id, null, 'FAC-SEED-010'],
      [ids.movimientoVarilla, materials.varilla.id, 'ENTRADA', 80, central.id, null, 'FAC-SEED-011'],
      [ids.movimientoArenaSalida, materials.arena.id, 'SALIDA', 12, null, central.id, 'VALE-SEED-002'],
    ]
    for (const [id, materialId, tipo, cantidad, ubicacionDestinoId, ubicacionOrigenId, documentoOrigen] of extraMovements) {
      await ensure(tx, 'movimientoInventario', id, { materialId, tipo, cantidad, fecha: new Date('2026-01-19T10:00:00Z'), usuarioId: admin.id, ubicacionDestinoId, ubicacionOrigenId, documentoOrigen, observaciones: 'Movimiento de demostracion' })
    }

    await ensure(tx, 'auditoria', ids.auditoria, { usuarioId: admin.id, accion: 'SEED_DEMO', entidad: 'Seed', entidadId: 'seed-v1', detalles: { version: 1, origen: 'scripts/seed.js' }, fecha: new Date('2026-01-16T12:00:00Z') })
  })

  console.log(`Seed completado en ${databaseName}: materiales, ubicaciones, proveedores, órdenes, recepción, movimientos, alerta y auditoría`) // no secrets
}

try {
  await run()
} finally {
  await prisma.$disconnect()
}
