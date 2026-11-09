import { Prisma } from '@prisma/client'
import { ValidationError, nonNegativeDecimal, requiredString } from './catalogValidation.js'
import { calculateStock } from './stockCalculator.js'
import { evaluateAlertContext } from './alertService.js'
import { withMaterialLock } from '../db/prisma.js'

export { calculateStock } from './stockCalculator.js'

const MOVEMENT_TYPES = ['ENTRADA', 'SALIDA', 'TRASLADO', 'AJUSTE']
const ADJUSTMENT_SENSES = ['INCREMENTO', 'DECREMENTO']

const notFound = (message) => Object.assign(new Error(message), { statusCode: 404, status: 'NOT_FOUND' })
const conflict = (message) => Object.assign(new Error(message), { statusCode: 409, status: 'CONFLICT' })

const decimal = (value) => new Prisma.Decimal(value)

const validateInput = (body) => {
  const { materialId, usuarioId, tipo } = body
  requiredString(materialId, 'materialId')
  requiredString(usuarioId, 'usuarioId')
  if (!MOVEMENT_TYPES.includes(tipo)) throw new ValidationError('tipo debe ser ENTRADA, SALIDA, TRASLADO o AJUSTE')
  const cantidad = nonNegativeDecimal(body.cantidad, 'cantidad')
  if (decimal(cantidad).isZero()) throw new ValidationError('cantidad debe ser estrictamente positiva')
  if (tipo === 'ENTRADA' && !body.ubicacionDestinoId) throw new ValidationError('ubicacionDestinoId es obligatoria para una entrada')
  if (tipo === 'SALIDA' && !body.ubicacionOrigenId) throw new ValidationError('ubicacionOrigenId es obligatoria para una salida')
  if (tipo === 'TRASLADO' && (!body.ubicacionOrigenId || !body.ubicacionDestinoId)) throw new ValidationError('origen y destino son obligatorios para un traslado')
  if (tipo === 'TRASLADO' && body.ubicacionOrigenId === body.ubicacionDestinoId) throw new ValidationError('origen y destino deben ser diferentes')
  if (tipo === 'AJUSTE' && !body.ubicacionOrigenId && !body.ubicacionDestinoId) throw new ValidationError('una ubicación es obligatoria para un ajuste')
  if (tipo === 'AJUSTE' && !ADJUSTMENT_SENSES.includes(body.sentidoAjuste)) throw new ValidationError('sentidoAjuste debe ser INCREMENTO o DECREMENTO')
  if (tipo === 'AJUSTE' && !body.observaciones?.trim()) throw new ValidationError('observaciones es obligatorio como justificación del ajuste')
  return { ...body, cantidad }
}

const ensureReferences = async (tx, input) => {
  const material = await tx.material.findUnique({ where: { id: input.materialId } })
  if (!material) throw notFound('Material no encontrado')
  const user = await tx.usuario.findUnique({ where: { id: input.usuarioId } })
  if (!user) throw notFound('Usuario responsable no encontrado')
  const locationIds = [input.ubicacionOrigenId, input.ubicacionDestinoId].filter(Boolean)
  for (const id of locationIds) if (!await tx.ubicacion.findUnique({ where: { id } })) throw notFound('Ubicación no encontrada')
}

const checkAvailable = async (tx, materialId, locationId, quantity) => {
  const movements = await tx.movimientoInventario.findMany({ where: { materialId } })
  const available = calculateStock(movements, locationId)
  if (available.lessThan(decimal(quantity))) throw conflict('Stock insuficiente para realizar el movimiento')
}

export const createMovement = async (prisma, body) => {
  const input = validateInput(body)
  const run = () => prisma.$transaction(async (tx) => {
      await ensureReferences(tx, input)
      if (input.tipo === 'SALIDA' || (input.tipo === 'TRASLADO') || (input.tipo === 'AJUSTE' && input.sentidoAjuste === 'DECREMENTO')) {
        await checkAvailable(tx, input.materialId, input.ubicacionOrigenId, input.cantidad)
      }
      const data = {
        materialId: input.materialId,
        tipo: input.tipo,
        sentidoAjuste: input.tipo === 'AJUSTE' ? input.sentidoAjuste : null,
        cantidad: input.cantidad,
        usuarioId: input.usuarioId,
        ubicacionOrigenId: input.ubicacionOrigenId || null,
        ubicacionDestinoId: input.ubicacionDestinoId || null,
        documentoOrigen: input.documentoOrigen?.trim() || null,
        observaciones: input.observaciones?.trim() || null,
        ...(input.fecha ? { fecha: new Date(input.fecha) } : {}),
      }
      const created = await tx.movimientoInventario.create({ data, include: { material: true, usuario: true, ubicacionOrigen: true, ubicacionDestino: true } })
      const locationIds = [input.ubicacionOrigenId, input.ubicacionDestinoId].filter(Boolean)
      await evaluateAlertContext(tx, { materialId: input.materialId, ubicacionIds: locationIds })
      return created
  })
  if (prisma.__skipAdvisoryLock) return run()
  return withMaterialLock(input.materialId, run)
}

export const listMovements = (prisma, query) => {
  const where = {}
  if (query.materialId) where.materialId = query.materialId
  if (query.usuarioId) where.usuarioId = query.usuarioId
  if (query.tipo) {
    if (!MOVEMENT_TYPES.includes(query.tipo)) throw new ValidationError('tipo de filtro inválido')
    where.tipo = query.tipo
  }
  if (query.ubicacionId) where.OR = [{ ubicacionOrigenId: query.ubicacionId }, { ubicacionDestinoId: query.ubicacionId }]
  if (query.fechaDesde || query.fechaHasta) {
    where.fecha = {}
    if (query.fechaDesde) where.fecha.gte = new Date(query.fechaDesde)
    if (query.fechaHasta) where.fecha.lte = new Date(query.fechaHasta)
  }
  return prisma.movimientoInventario.findMany({ where, orderBy: { fecha: 'desc' }, include: { material: true, usuario: true, ubicacionOrigen: true, ubicacionDestino: true } })
}

export const getMovement = async (prisma, id) => {
  const movement = await prisma.movimientoInventario.findUnique({ where: { id }, include: { material: true, usuario: true, ubicacionOrigen: true, ubicacionDestino: true, ordenCompra: true, detalleOrdenCompra: true } })
  if (!movement) throw notFound('Movimiento no encontrado')
  return movement
}
