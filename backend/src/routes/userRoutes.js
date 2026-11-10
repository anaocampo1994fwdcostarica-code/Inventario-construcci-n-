import express from 'express'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { userController } from '../controllers/userController.js'

export const userRoutes = express.Router()
userRoutes.get('/', asyncHandler(userController.list))
userRoutes.get('/:id', asyncHandler(userController.get))
userRoutes.post('/', asyncHandler(userController.create))
userRoutes.put('/:id', asyncHandler(userController.update))
