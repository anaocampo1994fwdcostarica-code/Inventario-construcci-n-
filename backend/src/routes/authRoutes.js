import express from 'express'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { requireAuth, requireCsrf } from '../middlewares/auth.js'
import { authController } from '../controllers/authController.js'
export const authRoutes = express.Router()
authRoutes.post('/login', asyncHandler(authController.login))
authRoutes.get('/me', requireAuth, asyncHandler(authController.me))
authRoutes.post('/logout', requireAuth, requireCsrf, asyncHandler(authController.logout))
