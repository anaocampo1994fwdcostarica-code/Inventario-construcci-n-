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

const password = process.env.SEED_ADMIN_PASSWORD
if (!password || password.length < 12) {
  throw new Error('SEED_ADMIN_PASSWORD es obligatorio y debe tener al menos 12 caracteres; nunca se usa una contraseña predeterminada')
}

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
  alertaGuantes: 'seed-alerta-guantes',
  auditoria: 'seed-auditoria-001',
}

const ensure = async (tx, model, id, data) => {
  const current = await tx[model].findUnique({ where: { id } })
  return current || tx[model].create({ data: { id, ...data } })
}

const run = async () => {
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id })

  await prisma.$transaction(async (tx) => {
    const admin = await ensure(tx, 'usuario', ids.admin, {
      identificacion: 'SEED-ADMIN',
      nombre: 'Administrador de Demostración',
      correo: 'admin.demo@obrastock.local',
      rol: 'ADMINISTRADOR',
      passwordHash,
    })

    const materials = {}
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

    const order1 = await ensure(tx, 'ordenCompra', ids.orden1, { numero: 'OC-SEED-001', proveedorId: proveedorA.id, fecha: new Date('2026-01-10T08:00:00Z'), estado: 'APROBADA', responsableId: admin.id, total: '1012.50', observaciones: 'Orden demostrativa principal' })
    const detailCemento1 = await ensure(tx, 'detalleOrdenCompra', ids.detalleCemento1, { ordenCompraId: order1.id, materialId: materials.cemento.id, cantidad: 100, precioUnitario: '8.50', subtotal: '850.00', cantidadRecibida: 60 })
    await ensure(tx, 'detalleOrdenCompra', ids.detalleArena1, { ordenCompraId: order1.id, materialId: materials.arena.id, cantidad: 50, precioUnitario: '3.25', subtotal: '162.50' })
    const order2 = await ensure(tx, 'ordenCompra', ids.orden2, { numero: 'OC-SEED-002', proveedorId: proveedorA.id, fecha: new Date('2026-01-13T08:00:00Z'), estado: 'SOLICITADA', responsableId: admin.id, total: '807.50', observaciones: 'Orden cercana para demostrar posible duplicidad' })
    await ensure(tx, 'detalleOrdenCompra', ids.detalleCemento2, { ordenCompraId: order2.id, materialId: materials.cemento.id, cantidad: 95, precioUnitario: '8.50', subtotal: '807.50' })

    const receipt = await ensure(tx, 'recepcionCompra', ids.recepcion, { ordenCompraId: order1.id, claveIdempotencia: 'seed-recepcion-001', solicitudHash: 'seed-recepcion-hash-001'.padEnd(64, '0'), usuarioId: admin.id, ubicacionId: central.id, referencia: 'FAC-SEED-001', observaciones: 'Recepción parcial demostrativa', fecha: new Date('2026-01-12T10:00:00Z') })
    const receiptDetail = await ensure(tx, 'detalleRecepcion', ids.detalleRecepcion, { recepcionId: receipt.id, detalleOrdenCompraId: detailCemento1.id, cantidad: 60 })
    await ensure(tx, 'movimientoInventario', ids.entradaCemento, { materialId: materials.cemento.id, tipo: 'ENTRADA', cantidad: 60, fecha: new Date('2026-01-12T10:00:00Z'), usuarioId: admin.id, ubicacionDestinoId: central.id, documentoOrigen: 'FAC-SEED-001', ordenCompraId: order1.id, detalleOrdenCompraId: detailCemento1.id, detalleRecepcionId: receiptDetail.id, recepcionCompraId: receipt.id, observaciones: 'Entrada trazable a recepción' })
    await ensure(tx, 'movimientoInventario', ids.salidaCemento, { materialId: materials.cemento.id, tipo: 'SALIDA', cantidad: 10, fecha: new Date('2026-01-14T10:00:00Z'), usuarioId: admin.id, ubicacionOrigenId: central.id, documentoOrigen: 'VALE-SEED-001', observaciones: 'Salida a cuadrilla' })
    await ensure(tx, 'movimientoInventario', ids.trasladoBlock, { materialId: materials.block.id, tipo: 'TRASLADO', cantidad: 30, fecha: new Date('2026-01-15T10:00:00Z'), usuarioId: admin.id, ubicacionOrigenId: central.id, ubicacionDestinoId: norte.id, documentoOrigen: 'TRAS-SEED-001', observaciones: 'Traslado a Obra Norte' })
    await ensure(tx, 'movimientoInventario', ids.entradaArena, { materialId: materials.arena.id, tipo: 'ENTRADA', cantidad: 50, fecha: new Date('2026-01-12T11:00:00Z'), usuarioId: admin.id, ubicacionDestinoId: central.id, documentoOrigen: 'FAC-SEED-002', observaciones: 'Entrada de arena' })
    await ensure(tx, 'movimientoInventario', ids.entradaPvc, { materialId: materials.pvc.id, tipo: 'ENTRADA', cantidad: 40, fecha: new Date('2026-01-13T11:00:00Z'), usuarioId: admin.id, ubicacionDestinoId: sur.id, documentoOrigen: 'FAC-SEED-003', observaciones: 'Entrada de tubería' })
    await ensure(tx, 'movimientoInventario', ids.ajusteBlock, { materialId: materials.block.id, tipo: 'AJUSTE', sentidoAjuste: 'INCREMENTO', cantidad: 5, fecha: new Date('2026-01-16T11:00:00Z'), usuarioId: admin.id, ubicacionDestinoId: central.id, documentoOrigen: 'AJU-SEED-001', observaciones: 'Ajuste positivo por conteo físico' })

    await ensure(tx, 'alertaInventario', ids.alertaGuantes, { materialId: materials.guantes.id, ubicacionId: central.id, tipo: 'PUNTO_REORDEN', estado: 'ACTIVA', descripcion: 'Stock de guantes en cero: requiere reposición', fecha: new Date('2026-01-16T12:00:00Z') })
    await ensure(tx, 'auditoria', ids.auditoria, { usuarioId: admin.id, accion: 'SEED_DEMO', entidad: 'Seed', entidadId: 'seed-v1', detalles: { version: 1, origen: 'scripts/seed.js' }, fecha: new Date('2026-01-16T12:00:00Z') })
  })

  console.log(`Seed completado en ${databaseName}: materiales, ubicaciones, proveedores, órdenes, recepción, movimientos, alerta y auditoría`) // no secrets
}

try {
  await run()
} finally {
  await prisma.$disconnect()
}
