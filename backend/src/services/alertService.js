import { Prisma } from '@prisma/client'
import { ValidationError } from './catalogValidation.js'
import { calculateStock } from './stockCalculator.js'

const ALERT_TYPES = ['PUNTO_REORDEN', 'STOCK_MAXIMO', 'STOCK_NEGATIVO', 'COMPRA_DUPLICADA']
const ALERT_STATES = ['ACTIVA', 'ATENDIDA', 'DESCARTADA']

const decimal = (value) => new Prisma.Decimal(value)

export const calculateReorder = (material) => {
  const average = decimal(material.demandaDiariaPromedio)
  const maximum = decimal(material.demandaDiariaMaxima)
  const leadTime = decimal(material.tiempoEntregaDias)
  if (maximum.lessThan(average)) throw new ValidationError('demandaDiariaMaxima debe ser mayor o igual a demandaDiariaPromedio')
  if (leadTime.lessThan(0)) throw new ValidationError('tiempoEntregaDias no puede ser negativo')
  const safetyStock = maximum.minus(average).times(leadTime)
  const reorderPoint = average.times(leadTime).plus(safetyStock)
  return { stockSeguridad: safetyStock, puntoReorden: reorderPoint }
}

const notFound = (message) => Object.assign(new Error(message), { statusCode: 404, status: 'NOT_FOUND' })

const evaluatePair = async (tx, material, location) => {
  const movements = await tx.movimientoInventario.findMany({ where: { materialId: material.id } })
  const stock = calculateStock(movements, location.id)
  const { stockSeguridad, puntoReorden } = calculateReorder(material)
  const isNegative = stock.lessThan(0)
  const isAboveMaximum = stock.greaterThan(decimal(material.stockMaximo))
  const isBelowMinimum = stock.lessThan(decimal(material.stockMinimo))
  const isReorder = !isNegative && (stock.lessThanOrEqualTo(puntoReorden) || isBelowMinimum)
  const desiredType = isNegative ? 'STOCK_NEGATIVO' : isAboveMaximum ? 'STOCK_MAXIMO' : isReorder ? 'PUNTO_REORDEN' : null
  const active = await tx.alertaInventario.findMany({ where: { materialId: material.id, ubicacionId: location.id, estado: 'ACTIVA' } })
  const results = []
  if (desiredType && !active.some((alert) => alert.tipo === desiredType)) {
    results.push(await tx.alertaInventario.create({ data: {
      materialId: material.id,
      ubicacionId: location.id,
      tipo: desiredType,
      estado: 'ACTIVA',
      descripcion: desiredType === 'STOCK_NEGATIVO'
        ? `Stock negativo detectado: ${stock.toFixed(3)}`
        : desiredType === 'STOCK_MAXIMO'
          ? `Stock ${stock.toFixed(3)} por encima del stock máximo ${decimal(material.stockMaximo).toFixed(3)}`
          : `Stock ${stock.toFixed(3)} en o por debajo del punto de reorden ${puntoReorden.toFixed(3)} (seguridad ${stockSeguridad.toFixed(3)})`,
    } }))
  }
  const obsolete = active.filter((alert) => ['PUNTO_REORDEN', 'STOCK_NEGATIVO', 'STOCK_MAXIMO'].includes(alert.tipo)).filter((alert) => alert.tipo !== desiredType)
  if (obsolete.length) await tx.alertaInventario.updateMany({ where: { id: { in: obsolete.map((alert) => alert.id) } }, data: { estado: 'ATENDIDA', atendidaAt: new Date() } })
  return { materialId: material.id, ubicacionId: location.id, stock, stockSeguridad, puntoReorden, alertaCreada: results.length > 0, alertas: results }
}

export const evaluateAlertContext = async (tx, { materialId, ubicacionIds }) => {
  const material = await tx.material.findUnique({ where: { id: materialId } })
  if (!material) throw notFound('Material no encontrado')
  const locations = await tx.ubicacion.findMany({ where: { id: { in: ubicacionIds } } })
  return Promise.all(locations.map((location) => evaluatePair(tx, material, location)))
}

export const listReorder = async (prisma, query) => {
  const materials = await prisma.material.findMany({ where: query.materialId ? { id: query.materialId } : {}, orderBy: { codigo: 'asc' } })
  const locations = await prisma.ubicacion.findMany({ where: query.ubicacionId ? { id: query.ubicacionId } : {}, orderBy: { codigo: 'asc' } })
  const result = []
  for (const material of materials) {
    const movements = await prisma.movimientoInventario.findMany({ where: { materialId: material.id } })
    const reorder = calculateReorder(material)
    for (const location of locations) result.push({ materialId: material.id, codigo: material.codigo, material: material.nombre, ubicacionId: location.id, ubicacion: location.nombre, stock: calculateStock(movements, location.id), ...reorder })
  }
  return result
}

export const getReorder = async (prisma, materialId, query) => {
  const result = await listReorder(prisma, { ...query, materialId })
  if (!result.length && !await prisma.material.findUnique({ where: { id: materialId } })) throw notFound('Material no encontrado')
  return result
}

export const listAlerts = (prisma, query) => {
  const where = {}
  if (query.materialId) where.materialId = query.materialId
  if (query.ubicacionId) where.ubicacionId = query.ubicacionId
  if (query.tipo) { if (!ALERT_TYPES.includes(query.tipo)) throw new ValidationError('tipo de alerta inválido'); where.tipo = query.tipo }
  if (query.estado) { if (!ALERT_STATES.includes(query.estado)) throw new ValidationError('estado de alerta inválido'); where.estado = query.estado }
  return prisma.alertaInventario.findMany({ where, orderBy: { fecha: 'desc' }, include: { material: true, ubicacion: true, atendidaPor: true } })
}

export const getAlert = async (prisma, id) => {
  const alert = await prisma.alertaInventario.findUnique({ where: { id }, include: { material: true, ubicacion: true, atendidaPor: true } })
  if (!alert) throw notFound('Alerta no encontrada')
  return alert
}

export const updateAlertState = async (prisma, id, estado) => {
  if (!ALERT_STATES.includes(estado)) throw new ValidationError('estado de alerta inválido')
  await getAlert(prisma, id)
  return prisma.alertaInventario.update({ where: { id }, data: { estado, ...(estado === 'ATENDIDA' ? { atendidaAt: new Date() } : {}) }, include: { material: true, ubicacion: true } })
}

export const evaluateAlerts = async (prisma, query) => {
  const materials = await prisma.material.findMany({ where: query.materialId ? { id: query.materialId } : {}, orderBy: { codigo: 'asc' } })
  const locations = await prisma.ubicacion.findMany({ where: query.ubicacionId ? { id: query.ubicacionId } : {}, orderBy: { codigo: 'asc' } })
  if (query.materialId && !materials.length) throw notFound('Material no encontrado')
  if (query.ubicacionId && !locations.length) throw notFound('Ubicación no encontrada')
  return prisma.$transaction(async (tx) => {
    const results = []
    for (const material of materials) for (const location of locations) results.push(await evaluatePair(tx, material, location))
    return results
  })
}
