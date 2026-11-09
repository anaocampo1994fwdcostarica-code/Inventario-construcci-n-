import { createMovement, getMovement, listMovements } from '../services/movementService.js'
import { listStock, stockByMaterial } from '../services/stockService.js'

export const movementController = {
  create: async (req, res) => res.status(201).json(await createMovement(req.app.locals.prisma, { ...req.body, ...(req.auth ? { usuarioId: req.auth.user.id } : {}) })),
  list: async (req, res) => res.status(200).json(await listMovements(req.app.locals.prisma, req.query)),
  get: async (req, res) => res.status(200).json(await getMovement(req.app.locals.prisma, req.params.id)),
}

export const stockController = {
  list: async (req, res) => res.status(200).json(await listStock(req.app.locals.prisma, req.query)),
  byMaterial: async (req, res) => res.status(200).json(await stockByMaterial(req.app.locals.prisma, req.params.materialId, req.query)),
}
