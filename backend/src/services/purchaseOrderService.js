import { Prisma } from '@prisma/client'
import { ValidationError, nonNegativeDecimal, requiredString } from './catalogValidation.js'

const STATES = ['BORRADOR', 'SOLICITADA', 'APROBADA', 'PARCIALMENTE_RECIBIDA', 'RECIBIDA', 'CANCELADA']
const transitions = {
  BORRADOR: ['SOLICITADA', 'CANCELADA'],
  SOLICITADA: ['APROBADA', 'CANCELADA'],
  APROBADA: ['CANCELADA'],
  PARCIALMENTE_RECIBIDA: [],
  RECIBIDA: [],
  CANCELADA: [],
}

const decimal = (value) => new Prisma.Decimal(value)
const notFound = (message) => Object.assign(new Error(message), { statusCode: 404, status: 'NOT_FOUND' })
const conflict = (message) => Object.assign(new Error(message), { statusCode: 409, status: 'CONFLICT' })

const validateDate = (value) => {
  if (value === undefined) return new Date()
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new ValidationError('fecha inválida')
  return date
}

const validateDetails = (details) => {
  if (!Array.isArray(details) || details.length === 0) throw new ValidationError('La orden debe contener al menos un detalle')
  return details.map((detail) => {
    const materialId = requiredString(detail.materialId, 'materialId')
    const cantidad = nonNegativeDecimal(detail.cantidad, 'cantidad')
    const precioUnitario = nonNegativeDecimal(detail.precioUnitario, 'precioUnitario')
    if (decimal(cantidad).isZero()) throw new ValidationError('cantidad debe ser mayor que cero')
    const subtotal = decimal(cantidad).times(decimal(precioUnitario)).toDecimalPlaces(2)
    return { materialId, cantidad, precioUnitario, subtotal: subtotal.toFixed(2) }
  })
}

const validateHeader = (body) => {
  const numero = requiredString(body.numero, 'numero')
  const proveedorId = requiredString(body.proveedorId, 'proveedorId')
  const responsableId = requiredString(body.responsableId, 'responsableId')
  const estado = body.estado || 'BORRADOR'
  if (!STATES.includes(estado)) throw new ValidationError('estado inválido')
  return { numero, proveedorId, responsableId, estado, fecha: validateDate(body.fecha), observaciones: body.observaciones?.trim() || null }
}

const ensureReferences = async (tx, header, details) => {
  if (!await tx.proveedor.findUnique({ where: { id: header.proveedorId } })) throw notFound('Proveedor no encontrado')
  if (!await tx.usuario.findUnique({ where: { id: header.responsableId } })) throw notFound('Usuario responsable no encontrado')
  for (const detail of details) if (!await tx.material.findUnique({ where: { id: detail.materialId } })) throw notFound('Material no encontrado')
}

const totalOf = (details) => details.reduce((total, detail) => total.plus(decimal(detail.subtotal)), decimal(0)).toDecimalPlaces(2)

const orderInclude = { proveedor: true, responsable: true, detalles: { include: { material: true } } }

const duplicateMatches = async (prisma, proposal, excludeId = null) => {
  const date = validateDate(proposal.fecha)
  const windowStart = new Date(date); windowStart.setDate(windowStart.getDate() - 7)
  const windowEnd = new Date(date); windowEnd.setDate(windowEnd.getDate() + 7)
  const details = validateDetails(proposal.detalles)
  const orders = await prisma.ordenCompra.findMany({
    where: { proveedorId: proposal.proveedorId, fecha: { gte: windowStart, lte: windowEnd }, ...(excludeId ? { id: { not: excludeId } } : {}), estado: { not: 'CANCELADA' } },
    include: { detalles: true },
  })
  const matches = []
  for (const order of orders) {
    const coincidences = []
    for (const proposed of details) {
      const existing = order.detalles.find((detail) => detail.materialId === proposed.materialId)
      if (!existing) continue
      const proposedQuantity = decimal(proposed.cantidad)
      const existingQuantity = decimal(existing.cantidad)
      const difference = proposedQuantity.isZero() ? decimal(1) : existingQuantity.minus(proposedQuantity).abs().div(proposedQuantity)
      if (difference.lessThanOrEqualTo(0.1)) coincidences.push({ materialId: proposed.materialId, cantidadPropuesta: proposedQuantity.toFixed(3), cantidadExistente: existingQuantity.toFixed(3) })
    }
    if (coincidences.length) matches.push({ ordenId: order.id, numero: order.numero, fecha: order.fecha, materiales: coincidences, motivo: 'Mismo proveedor, material coincidente, cantidades dentro del 10% y fechas dentro de 7 días' })
  }
  return { posibleDuplicado: matches.length > 0, coincidencias: matches, parametros: { ventanaDias: 7, toleranciaCantidad: 0.1 } }
}

export const detectPotentialDuplicates = async (prisma, body, excludeId = null) => {
  const header = validateHeader(body)
  return duplicateMatches(prisma, { ...header, detalles: body.detalles }, excludeId)
}

export const createPurchaseOrder = async (prisma, body) => {
  const header = validateHeader(body)
  const details = validateDetails(body.detalles)
  const warning = await duplicateMatches(prisma, { ...header, detalles: body.detalles })
  const order = await prisma.$transaction(async (tx) => {
    await ensureReferences(tx, header, details)
    const total = totalOf(details)
    return tx.ordenCompra.create({ data: { ...header, total, detalles: { create: details } }, include: orderInclude })
  })
  return { orden: order, advertenciasDuplicados: warning }
}

export const listPurchaseOrders = (prisma, query) => prisma.ordenCompra.findMany({ where: query.proveedorId ? { proveedorId: query.proveedorId } : {}, orderBy: { fecha: 'desc' }, include: orderInclude })

export const getPurchaseOrder = async (prisma, id) => {
  const order = await prisma.ordenCompra.findUnique({ where: { id }, include: { ...orderInclude, movimientos: true } })
  if (!order) throw notFound('Orden de compra no encontrada')
  return order
}

const ensureMutable = (order) => {
  if (!['BORRADOR', 'SOLICITADA'].includes(order.estado)) throw conflict('La orden no puede modificarse en su estado actual')
  if (order.movimientos?.length) throw conflict('La orden tiene movimientos asociados y no puede modificarse')
}

export const updatePurchaseOrder = async (prisma, id, body) => prisma.$transaction(async (tx) => {
  const current = await tx.ordenCompra.findUnique({ where: { id }, include: { movimientos: true, detalles: true } })
  if (!current) throw notFound('Orden de compra no encontrada')
  ensureMutable(current)
  const header = validateHeader({ ...current, ...body, numero: body.numero ?? current.numero, proveedorId: body.proveedorId ?? current.proveedorId, responsableId: body.responsableId ?? current.responsableId, fecha: body.fecha ?? current.fecha, estado: body.estado ?? current.estado })
  const details = validateDetails(body.detalles ?? current.detalles)
  await ensureReferences(tx, header, details)
  const total = totalOf(details)
  await tx.detalleOrdenCompra.deleteMany({ where: { ordenCompraId: id } })
  return tx.ordenCompra.update({ where: { id }, data: { ...header, total, detalles: { create: details } }, include: orderInclude })
})

export const updatePurchaseOrderState = async (prisma, id, nextState) => {
  if (!STATES.includes(nextState)) throw new ValidationError('estado inválido')
  const current = await getPurchaseOrder(prisma, id)
  if (!transitions[current.estado].includes(nextState)) throw conflict(`No se permite cambiar de ${current.estado} a ${nextState}`)
  return prisma.ordenCompra.update({ where: { id }, data: { estado: nextState }, include: orderInclude })
}
