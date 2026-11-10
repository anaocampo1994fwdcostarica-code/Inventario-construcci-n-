import { createPurchaseOrder, detectPotentialDuplicates, getPurchaseOrder, listPurchaseOrders, updatePurchaseOrder, updatePurchaseOrderState } from '../services/purchaseOrderService.js'

export const purchaseOrderController = {
  create: async (req, res) => res.status(201).json(await createPurchaseOrder(req.app.locals.prisma, { ...req.body, ...(req.auth ? { responsableId: req.auth.user.id } : {}) })),
  list: async (req, res) => res.status(200).json(await listPurchaseOrders(req.app.locals.prisma, req.query)),
  get: async (req, res) => res.status(200).json(await getPurchaseOrder(req.app.locals.prisma, req.params.id)),
  update: async (req, res) => res.status(200).json(await updatePurchaseOrder(req.app.locals.prisma, req.params.id, { ...req.body, ...(req.auth ? { responsableId: req.auth.user.id } : {}) })),
  state: async (req, res) => res.status(200).json(await updatePurchaseOrderState(req.app.locals.prisma, req.params.id, req.body.estado)),
  duplicates: async (req, res) => res.status(200).json(await detectPotentialDuplicates(req.app.locals.prisma, req.body)),
}
