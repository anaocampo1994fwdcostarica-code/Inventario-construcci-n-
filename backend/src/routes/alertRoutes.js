import express from 'express'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { alertController } from '../controllers/alertController.js'

export const reorderRoutes = express.Router()
reorderRoutes.get('/', asyncHandler(alertController.reorder))
reorderRoutes.get('/:materialId', asyncHandler(alertController.reorderByMaterial))

export const alertRoutes = express.Router()
alertRoutes.post('/evaluar', asyncHandler(alertController.evaluate))
alertRoutes.get('/', asyncHandler(alertController.list))
alertRoutes.get('/:id', asyncHandler(alertController.get))
alertRoutes.patch('/:id/estado', asyncHandler(alertController.state))
