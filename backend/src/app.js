import express from 'express'
import cors from 'cors'
import { getPrisma } from './db/prisma.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { locationRoutes, materialRoutes, supplierRoutes } from './routes/catalogRoutes.js'
import { movementRoutes, stockRoutes } from './routes/movementRoutes.js'
import { purchaseOrderRoutes } from './routes/purchaseOrderRoutes.js'
import { alertRoutes, reorderRoutes } from './routes/alertRoutes.js'
import { userRoutes } from './routes/userRoutes.js'
import { authRoutes } from './routes/authRoutes.js'
import { authorizeRequest, requireAuth, requireCsrf } from './middlewares/auth.js'

export const createApp = ({ prisma, allowUnauthenticated = false } = {}) => {
  const app = express()
  app.locals.prisma = prisma || getPrisma()
  app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173', credentials: true }))
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.get('/api/health', (_req, res) => res.status(200).json({ status: 'OK', message: 'API health', version: '1.0.0' }))
  if (!allowUnauthenticated && process.env.NODE_ENV !== 'test') app.use('/api', requireAuth, requireCsrf, authorizeRequest)
  app.get('/api/health', (_req, res) => res.status(200).json({ status: 'OK', message: 'API de Gestión de Inventarios funcionando', version: '1.0.0' }))
  app.use('/api/materiales', materialRoutes)
  app.use('/api/ubicaciones', locationRoutes)
  app.use('/api/proveedores', supplierRoutes)
  app.use('/api/usuarios', userRoutes)
  app.use('/api/movimientos', movementRoutes)
  app.use('/api/inventario/stock', stockRoutes)
  app.use('/api/ordenes-compra', purchaseOrderRoutes)
  app.use('/api/inventario/reorden', reorderRoutes)
  app.use('/api/alertas', alertRoutes)
  app.use((_req, res) => res.status(404).json({ status: 'NOT_FOUND', message: 'Endpoint no encontrado' }))
  app.use(errorHandler)
  return app
}

export default createApp()
