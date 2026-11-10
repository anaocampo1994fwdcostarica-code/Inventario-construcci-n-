import express from 'express'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { locationController, materialController, supplierController } from '../controllers/catalogController.js'

const routerFor = (controller) => {
  const router = express.Router()
  router.get('/', asyncHandler(controller.list))
  router.get('/:id', asyncHandler(controller.get))
  router.post('/', asyncHandler(controller.create))
  router.put('/:id', asyncHandler(controller.update))
  router.delete('/:id', asyncHandler(controller.remove))
  return router
}

export const materialRoutes = routerFor(materialController)
export const locationRoutes = routerFor(locationController)
export const supplierRoutes = routerFor(supplierController)
