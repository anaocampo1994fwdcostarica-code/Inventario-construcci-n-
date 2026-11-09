import express from 'express'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { purchaseOrderController } from '../controllers/purchaseOrderController.js'
import { receiptController } from '../controllers/receiptController.js'

export const purchaseOrderRoutes = express.Router()
purchaseOrderRoutes.post('/verificar-duplicados', asyncHandler(purchaseOrderController.duplicates))
purchaseOrderRoutes.post('/:id/recepciones', asyncHandler(receiptController.create))
purchaseOrderRoutes.get('/:id/recepciones', asyncHandler(receiptController.list))
purchaseOrderRoutes.get('/:id/recepciones/:recepcionId', asyncHandler(receiptController.get))
purchaseOrderRoutes.post('/', asyncHandler(purchaseOrderController.create))
purchaseOrderRoutes.get('/', asyncHandler(purchaseOrderController.list))
purchaseOrderRoutes.get('/:id', asyncHandler(purchaseOrderController.get))
purchaseOrderRoutes.put('/:id', asyncHandler(purchaseOrderController.update))
purchaseOrderRoutes.patch('/:id/estado', asyncHandler(purchaseOrderController.state))
