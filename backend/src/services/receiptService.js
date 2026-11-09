import crypto from 'node:crypto'
import { Prisma } from '@prisma/client'
import { ValidationError, nonNegativeDecimal, requiredString } from './catalogValidation.js'
import { evaluateAlertContext } from './alertService.js'
import { withOrderLock } from '../db/prisma.js'

const decimal = (value) => new Prisma.Decimal(value)
const notFound = (message) => Object.assign(new Error(message), { statusCode: 404, status: 'NOT_FOUND' })
const conflict = (message) => Object.assign(new Error(message), { statusCode: 409, status: 'CONFLICT' })
const allowedStates = ['APROBADA', 'PARCIALMENTE_RECIBIDA']

const normalizeDecimal = (value) => decimal(value).toFixed(3)
export const normalizeReceipt = (body) => {
  const details = [...(body.detalles || [])].map((item) => ({ detalleOrdenCompraId: String(item.detalleOrdenCompraId || '').trim(), cantidad: normalizeDecimal(item.cantidad) })).sort((a, b) => a.detalleOrdenCompraId.localeCompare(b.detalleOrdenCompraId))
  return JSON.stringify({ usuarioId: String(body.usuarioId || '').trim(), ubicacionId: String(body.ubicacionId || '').trim(), referencia: body.referencia?.trim() || null, observaciones: body.observaciones?.trim() || null, detalles: details })
}
const hashReceipt = (body) => crypto.createHash('sha256').update(normalizeReceipt(body)).digest('hex')

const validateBody = (body) => {
  const claveIdempotencia = requiredString(body.claveIdempotencia, 'claveIdempotencia')
  const usuarioId = requiredString(body.usuarioId, 'usuarioId')
  const ubicacionId = requiredString(body.ubicacionId, 'ubicacionId')
  if (!Array.isArray(body.detalles) || !body.detalles.length) throw new ValidationError('La recepción debe contener al menos un detalle')
  const seen = new Set()
  const detalles = body.detalles.map((item) => {
    const detalleOrdenCompraId = requiredString(item.detalleOrdenCompraId, 'detalleOrdenCompraId')
    if (seen.has(detalleOrdenCompraId)) throw new ValidationError('No se permiten detalles repetidos')
    seen.add(detalleOrdenCompraId)
    const cantidad = nonNegativeDecimal(item.cantidad, 'cantidad')
    if (decimal(cantidad).isZero()) throw new ValidationError('cantidad debe ser estrictamente positiva')
    return { detalleOrdenCompraId, cantidad }
  })
  return { claveIdempotencia, usuarioId, ubicacionId, detalles, referencia: body.referencia?.trim() || null, observaciones: body.observaciones?.trim() || null }
}

const include = { usuario: true, ubicacion: true, detalles: { include: { detalleOrdenCompra: { include: { material: true } }, movimiento: true } }, movimientos: true }

const processReceipt = async (prisma, orderId, body) => {
  const input = validateBody(body); const solicitudHash = hashReceipt(input)
  return prisma.$transaction(async (tx) => {
    const existing = await tx.recepcionCompra.findUnique({ where: { claveIdempotencia: input.claveIdempotencia }, include })
    if (existing) { if (existing.solicitudHash !== solicitudHash) throw conflict('La clave de idempotencia ya fue utilizada con otra solicitud'); return existing }
    const order = await tx.ordenCompra.findUnique({ where: { id: orderId }, include: { detalles: true } })
    if (!order) throw notFound('Orden de compra no encontrada')
    if (!allowedStates.includes(order.estado)) throw conflict('La orden no está disponible para recepción')
    const user = await tx.usuario.findUnique({ where: { id: input.usuarioId } }); if (!user) throw notFound('Usuario responsable no encontrado'); if (!user.activo) throw conflict('El usuario responsable está inactivo')
    if (!await tx.ubicacion.findUnique({ where: { id: input.ubicacionId } })) throw notFound('Ubicación no encontrada')
    const orderDetails = new Map(order.detalles.map((detail) => [detail.id, detail]))
    for (const item of input.detalles) { const detail = orderDetails.get(item.detalleOrdenCompraId); if (!detail) throw notFound('Detalle de orden no encontrado'); if (decimal(detail.cantidadRecibida).plus(item.cantidad).greaterThan(detail.cantidad)) throw conflict('La cantidad recibida supera la cantidad pendiente') }
    const receipt = await tx.recepcionCompra.create({ data: { ordenCompraId: orderId, claveIdempotencia: input.claveIdempotencia, solicitudHash, usuarioId: input.usuarioId, ubicacionId: input.ubicacionId, referencia: input.referencia, observaciones: input.observaciones }, include: { usuario: true, ubicacion: true } })
    const locationIds = []
    const materialIds = new Set()
    for (const item of input.detalles) {
      const detail = orderDetails.get(item.detalleOrdenCompraId)
      const receiptDetail = await tx.detalleRecepcion.create({ data: { recepcionId: receipt.id, detalleOrdenCompraId: detail.id, cantidad: item.cantidad } })
      await tx.movimientoInventario.create({ data: { materialId: detail.materialId, tipo: 'ENTRADA', cantidad: item.cantidad, usuarioId: input.usuarioId, ubicacionDestinoId: input.ubicacionId, documentoOrigen: input.referencia, observaciones: input.observaciones, ordenCompraId: orderId, detalleOrdenCompraId: detail.id, recepcionCompraId: receipt.id, detalleRecepcionId: receiptDetail.id } })
      await tx.detalleOrdenCompra.update({ where: { id: detail.id }, data: { cantidadRecibida: { increment: item.cantidad } } })
      locationIds.push(input.ubicacionId)
      materialIds.add(detail.materialId)
    }
    for (const materialId of materialIds) await evaluateAlertContext(tx, { materialId, ubicacionIds: [...new Set(locationIds)] })
    const refreshed = await tx.detalleOrdenCompra.findMany({ where: { ordenCompraId: orderId } })
    const complete = refreshed.every((detail) => decimal(detail.cantidadRecibida).greaterThanOrEqualTo(detail.cantidad))
    await tx.ordenCompra.update({ where: { id: orderId }, data: { estado: complete ? 'RECIBIDA' : 'PARCIALMENTE_RECIBIDA' } })
    await tx.auditoria.create({ data: { usuarioId: input.usuarioId, accion: 'RECEPCION_COMPRA', entidad: 'RecepcionCompra', entidadId: receipt.id, detalles: { ordenCompraId: orderId, claveIdempotencia: input.claveIdempotencia } } })
    return tx.recepcionCompra.findUnique({ where: { id: receipt.id }, include })
  })
}

export const createReceipt = async (prisma, orderId, body) => prisma.__skipAdvisoryLock ? processReceipt(prisma, orderId, body) : withOrderLock(orderId, () => processReceipt(prisma, orderId, body))
export const listReceipts = (prisma, orderId) => prisma.recepcionCompra.findMany({ where: { ordenCompraId: orderId }, orderBy: { fecha: 'desc' }, include })
export const getReceipt = async (prisma, orderId, receiptId) => { const receipt = await prisma.recepcionCompra.findFirst({ where: { id: receiptId, ordenCompraId: orderId }, include }); if (!receipt) throw notFound('Recepción no encontrada'); return receipt }
