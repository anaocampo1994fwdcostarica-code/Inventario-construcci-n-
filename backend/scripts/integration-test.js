import 'dotenv/config'
import request from 'supertest'
import { Prisma } from '@prisma/client'

const expectedDatabase = 'gestion_inventario_construccion_test'
const configuredUrl = new URL(process.env.DATABASE_URL)
configuredUrl.pathname = `/${expectedDatabase}`
process.env.DATABASE_URL = configuredUrl.toString()
const { createApp } = await import('../src/app.js')
const { getPrisma, disconnectPrisma } = await import('../src/db/prisma.js')
const prisma = getPrisma()
const app = createApp({ prisma, allowUnauthenticated: true })
const ids = { users: [], suppliers: [], materials: [], locations: [], orders: [], movements: [], alerts: [] }

const assert = (condition, message) => { if (!condition) throw new Error(message) }
const idOf = (response) => response.body.id || response.body.orden?.id

const cleanup = async () => {
  const testMaterial = await prisma.material.findUnique({ where: { codigo: 'TEST-CEM' } })
  const materialIds = [...new Set([...ids.materials, testMaterial?.id].filter(Boolean))]
  const testOrders = await prisma.ordenCompra.findMany({ where: { numero: { startsWith: 'TEST-' } }, select: { id: true } })
  const orderIds = [...new Set([...ids.orders, ...testOrders.map((order) => order.id)])]
  if (materialIds.length) await prisma.alertaInventario.deleteMany({ where: { materialId: { in: materialIds } } })
  if (materialIds.length) await prisma.movimientoInventario.deleteMany({ where: { materialId: { in: materialIds } } })
  if (orderIds.length) await prisma.detalleRecepcion.deleteMany({ where: { recepcion: { ordenCompraId: { in: orderIds } } } })
  if (orderIds.length) await prisma.recepcionCompra.deleteMany({ where: { ordenCompraId: { in: orderIds } } })
  if (orderIds.length) await prisma.detalleOrdenCompra.deleteMany({ where: { ordenCompraId: { in: orderIds } } })
  if (orderIds.length) await prisma.ordenCompra.deleteMany({ where: { id: { in: orderIds } } })
  if (materialIds.length) await prisma.material.deleteMany({ where: { id: { in: materialIds } } })
  await prisma.ubicacion.deleteMany({ where: { codigo: { in: ['TEST-BOD', 'TEST-OBR'] } } })
  await prisma.proveedor.deleteMany({ where: { identificacion: 'TEST-PROV' } })
  await prisma.usuario.deleteMany({ where: { identificacion: 'TEST-ANA' } })
}

const run = async () => {
  const databaseResult = await prisma.$queryRaw`SELECT DATABASE() AS databaseName`
  assert(databaseResult[0].databaseName === expectedDatabase, `Base activa inesperada: ${databaseResult[0].databaseName}`)
  const tables = await prisma.$queryRaw`SELECT COUNT(*) AS total FROM information_schema.tables WHERE table_schema = ${expectedDatabase}`
  assert(Number(tables[0].total) === 13, 'La base de pruebas no contiene las 11 tablas de negocio, Sesion y _prisma_migrations')

  const user = await prisma.usuario.create({ data: { identificacion: 'TEST-ANA', nombre: 'Usuario QA', correo: 'qa-test@example.com', rol: 'ENCARGADO_BODEGA' } })
  ids.users.push(user.id)
  const supplier = (await request(app).post('/api/proveedores').send({ identificacion: 'TEST-PROV', nombre: 'Proveedor QA' })).body
  ids.suppliers.push(supplier.id)
  const material = (await request(app).post('/api/materiales').send({ codigo: 'TEST-CEM', nombre: 'Cemento QA', unidadMedida: 'saco', stockMinimo: 2, stockMaximo: 100, demandaDiariaPromedio: 5, demandaDiariaMaxima: 8, tiempoEntregaDias: 3 })).body
  ids.materials.push(material.id)
  const warehouse = (await request(app).post('/api/ubicaciones').send({ codigo: 'TEST-BOD', nombre: 'Bodega QA', tipo: 'BODEGA' })).body
  const work = (await request(app).post('/api/ubicaciones').send({ codigo: 'TEST-OBR', nombre: 'Obra QA', tipo: 'OBRA' })).body
  ids.locations.push(warehouse.id, work.id)

  const beforeOrder = await request(app).get(`/api/inventario/stock/${material.id}`)
  const order = await request(app).post('/api/ordenes-compra').send({ numero: 'TEST-OC-001', proveedorId: supplier.id, responsableId: user.id, detalles: [{ materialId: material.id, cantidad: 10, precioUnitario: 20 }] })
  assert(order.status === 201, 'No se pudo crear la orden de prueba')
  ids.orders.push(order.body.orden.id)
  const afterOrder = await request(app).get(`/api/inventario/stock/${material.id}`)
  assert(JSON.stringify(beforeOrder.body) === JSON.stringify(afterOrder.body), 'Crear una orden alteró el stock')

  const entry = await request(app).post('/api/movimientos').send({ materialId: material.id, tipo: 'ENTRADA', cantidad: 10, ubicacionDestinoId: warehouse.id, usuarioId: user.id, observaciones: 'Entrada QA' })
  assert(entry.status === 201, 'Entrada QA falló'); ids.movements.push(entry.body.id)
  let stock = (await request(app).get(`/api/inventario/stock/${material.id}`)).body
  const warehouseStock = stock.find((row) => row.ubicacionId === warehouse.id)
  assert(Number(warehouseStock.stock) === 10, 'Stock de bodega no es 10')

  const exit = await request(app).post('/api/movimientos').send({ materialId: material.id, tipo: 'SALIDA', cantidad: 2, ubicacionOrigenId: warehouse.id, usuarioId: user.id, observaciones: 'Salida QA' })
  assert(exit.status === 201, 'Salida QA falló'); ids.movements.push(exit.body.id)
  stock = (await request(app).get(`/api/inventario/stock/${material.id}`)).body
  assert(Number(stock.find((row) => row.ubicacionId === warehouse.id).stock) === 8, 'Salida no redujo stock correctamente')

  const transfer = await request(app).post('/api/movimientos').send({ materialId: material.id, tipo: 'TRASLADO', cantidad: 3, ubicacionOrigenId: warehouse.id, ubicacionDestinoId: work.id, usuarioId: user.id, observaciones: 'Traslado QA' })
  assert(transfer.status === 201, 'Traslado QA falló'); ids.movements.push(transfer.body.id)
  stock = (await request(app).get(`/api/inventario/stock/${material.id}`)).body
  assert(Number(stock.find((row) => row.ubicacion === 'GLOBAL').stock) === 8, 'Traslado alteró stock global')

  const positive = await request(app).post('/api/movimientos').send({ materialId: material.id, tipo: 'AJUSTE', sentidoAjuste: 'INCREMENTO', cantidad: 2, ubicacionDestinoId: warehouse.id, usuarioId: user.id, observaciones: 'Ajuste positivo QA' })
  const negative = await request(app).post('/api/movimientos').send({ materialId: material.id, tipo: 'AJUSTE', sentidoAjuste: 'DECREMENTO', cantidad: 1, ubicacionOrigenId: warehouse.id, usuarioId: user.id, observaciones: 'Ajuste negativo QA' })
  assert(positive.status === 201 && negative.status === 201, 'Ajustes QA fallaron'); ids.movements.push(positive.body.id, negative.body.id)

  const history = await request(app).get(`/api/movimientos?materialId=${material.id}`)
  assert(history.status === 200 && history.body.length === 5, 'Historial incompleto')
  const reorder = await request(app).get(`/api/inventario/reorden/${material.id}`)
  assert(reorder.status === 200, 'Evaluación de reorden falló')
  const alerts = await request(app).post('/api/alertas/evaluar').send({ materialId: material.id, ubicacionId: warehouse.id })
  assert(alerts.status === 200, 'Evaluación de alertas falló')
  const alertsAgain = await request(app).post('/api/alertas/evaluar').send({ materialId: material.id, ubicacionId: warehouse.id })
  assert(alertsAgain.status === 200, 'Evaluación idempotente falló')
  const alertRows = await request(app).get(`/api/alertas?materialId=${material.id}`)
  const activeByType = new Map()
  for (const row of alertRows.body.filter((row) => row.estado === 'ACTIVA')) {
    const key = `${row.tipo}:${row.ubicacionId}`
    activeByType.set(key, (activeByType.get(key) || 0) + 1)
  }
  assert([...activeByType.values()].every((count) => count === 1), 'Se duplicaron alertas activas')
  const duplicates = await request(app).post('/api/ordenes-compra/verificar-duplicados').send({ numero: 'TEST-OC-002', proveedorId: supplier.id, responsableId: user.id, detalles: [{ materialId: material.id, cantidad: 10, precioUnitario: 20 }] })
  assert(duplicates.status === 200 && duplicates.body.posibleDuplicado === true, 'No se detectó la orden potencialmente duplicada')

  const concurrentA = request(app).post('/api/movimientos').send({ materialId: material.id, tipo: 'SALIDA', cantidad: 4, ubicacionOrigenId: warehouse.id, usuarioId: user.id, observaciones: 'Concurrencia A' })
  const concurrentB = request(app).post('/api/movimientos').send({ materialId: material.id, tipo: 'SALIDA', cantidad: 4, ubicacionOrigenId: warehouse.id, usuarioId: user.id, observaciones: 'Concurrencia B' })
  const concurrent = await Promise.all([concurrentA, concurrentB])
  const successful = concurrent.filter((response) => response.status === 201)
  console.log(JSON.stringify({ concurrentStatuses: concurrent.map((response) => ({ status: response.status, message: response.body?.message })) }))
  assert(successful.length === 1, 'La prueba concurrente no produjo exactamente una aceptación')
  for (const response of successful) ids.movements.push(response.body.id)
  stock = (await request(app).get(`/api/inventario/stock/${material.id}`)).body
  assert(Number(stock.find((row) => row.ubicacionId === warehouse.id).stock) >= 0, 'Stock negativo tras concurrencia')
  const transferA = request(app).post('/api/movimientos').send({ materialId: material.id, tipo: 'TRASLADO', cantidad: 2, ubicacionOrigenId: warehouse.id, ubicacionDestinoId: work.id, usuarioId: user.id, observaciones: 'Traslado concurrente A' })
  const transferB = request(app).post('/api/movimientos').send({ materialId: material.id, tipo: 'TRASLADO', cantidad: 2, ubicacionOrigenId: warehouse.id, ubicacionDestinoId: work.id, usuarioId: user.id, observaciones: 'Traslado concurrente B' })
  const transfers = await Promise.all([transferA, transferB])
  const successfulTransfers = transfers.filter((response) => response.status === 201)
  assert(successfulTransfers.length === 1, 'El traslado concurrente no produjo exactamente una aceptación')
  for (const response of successfulTransfers) ids.movements.push(response.body.id)

  stock = (await request(app).get(`/api/inventario/stock/${material.id}`)).body
  assert(Number(stock.find((row) => row.ubicacionId === warehouse.id).stock) >= 0, 'Stock negativo tras traslado concurrente')
  console.log(JSON.stringify({ database: expectedDatabase, flow: 'passed', orderNoStockChange: true, historyCount: history.body.length, duplicateDetected: true, concurrentAccepted: successful.length, concurrentTransfersAccepted: successfulTransfers.length, finalWarehouseStock: stock.find((row) => row.ubicacionId === warehouse.id).stock }))
}

try {
  await run()
} finally {
  await cleanup()
  await disconnectPrisma()
}
