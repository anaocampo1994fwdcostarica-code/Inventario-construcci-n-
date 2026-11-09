import express from 'express'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { movementController, stockController } from '../controllers/movementController.js'

export const movementRoutes = express.Router()
movementRoutes.post('/', asyncHandler(movementController.create))
movementRoutes.get('/', asyncHandler(movementController.list))
movementRoutes.get('/:id', asyncHandler(movementController.get))

export const stockRoutes = express.Router()
stockRoutes.get('/', asyncHandler(stockController.list))
stockRoutes.get('/:materialId', asyncHandler(stockController.byMaterial))
