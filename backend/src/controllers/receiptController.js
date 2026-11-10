import { createReceipt, getReceipt, listReceipts } from '../services/receiptService.js'

export const receiptController = {
  create: async (req, res) => res.status(201).json(await createReceipt(req.app.locals.prisma, req.params.id, { ...req.body, ...(req.auth ? { usuarioId: req.auth.user.id } : {}) })),
  list: async (req, res) => res.status(200).json(await listReceipts(req.app.locals.prisma, req.params.id)),
  get: async (req, res) => res.status(200).json(await getReceipt(req.app.locals.prisma, req.params.id, req.params.recepcionId)),
}
