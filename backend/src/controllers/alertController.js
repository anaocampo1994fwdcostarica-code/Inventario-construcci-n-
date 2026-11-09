import { evaluateAlerts, getAlert, getReorder, listAlerts, listReorder, updateAlertState } from '../services/alertService.js'

export const alertController = {
  reorder: async (req, res) => res.status(200).json(await listReorder(req.app.locals.prisma, req.query)),
  reorderByMaterial: async (req, res) => res.status(200).json(await getReorder(req.app.locals.prisma, req.params.materialId, req.query)),
  list: async (req, res) => res.status(200).json(await listAlerts(req.app.locals.prisma, req.query)),
  get: async (req, res) => res.status(200).json(await getAlert(req.app.locals.prisma, req.params.id)),
  state: async (req, res) => res.status(200).json(await updateAlertState(req.app.locals.prisma, req.params.id, req.body.estado)),
  evaluate: async (req, res) => res.status(200).json(await evaluateAlerts(req.app.locals.prisma, req.body || {})),
}
