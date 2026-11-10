import { getSession } from '../services/authService.js'
const parseCookies = (header = '') => Object.fromEntries(header.split(';').map((part) => part.trim().split('=').map(decodeURIComponent)).filter(([key]) => key))
export const requireAuth = async (req, res, next) => { const cookies = parseCookies(req.headers.cookie); const auth = await getSession(req.app.locals.prisma, cookies.sid); if (!auth) return res.status(401).json({ status: 'UNAUTHORIZED', message: 'Autenticación requerida' }); req.auth = { ...auth, cookies }; return next() }
export const requireCsrf = (req, res, next) => { if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next(); if (!req.auth?.cookies?.csrf || req.auth.cookies.csrf !== req.headers['x-csrf-token']) return res.status(403).json({ status: 'FORBIDDEN', message: 'Token CSRF inválido' }); return next() }
export const requirePermission = (...roles) => (req, res, next) => { if (!req.auth) return res.status(401).json({ status: 'UNAUTHORIZED', message: 'Autenticación requerida' }); if (!roles.includes(req.auth.user.rol)) return res.status(403).json({ status: 'FORBIDDEN', message: 'No tiene permisos para esta operación' }); return next() }
export const authorizeRequest = (req, res, next) => {
  const admin = req.auth.user.rol === 'ADMINISTRADOR'; const employee = ['ENCARGADO_BODEGA', 'SUPERVISOR_OBRA'].includes(req.auth.user.rol); const read = req.method === 'GET'; const path = req.path
  if (path.startsWith('/usuarios')) return admin ? next() : res.status(403).json({ status: 'FORBIDDEN', message: 'Gestión de usuarios requiere permisos administrativos' })
  if (path.startsWith('/materiales') || path.startsWith('/proveedores') || path.startsWith('/ubicaciones')) return read || admin ? next() : res.status(403).json({ status: 'FORBIDDEN', message: 'Operación administrativa no permitida' })
  if (path.startsWith('/movimientos')) return read || admin || employee ? next() : res.status(403).json({ status: 'FORBIDDEN', message: 'El rol de consulta no puede registrar movimientos' })
  if (path.startsWith('/inventario/stock') || path.startsWith('/inventario/reorden')) return read ? next() : res.status(403).json({ status: 'FORBIDDEN', message: 'Consulta de inventario únicamente' })
  if (path.startsWith('/ordenes-compra')) { if (path.includes('/estado')) return admin ? next() : res.status(403).json({ status: 'FORBIDDEN', message: 'Aprobación y cancelación requieren permisos administrativos' }); return read || admin || employee ? next() : res.status(403).json({ status: 'FORBIDDEN', message: 'El rol de consulta no puede modificar compras' }) }
  if (path.startsWith('/alertas')) { if (path.includes('/estado') || path.includes('/evaluar')) return admin ? next() : res.status(403).json({ status: 'FORBIDDEN', message: 'Gestión de alertas requiere permisos administrativos' }); return read ? next() : res.status(403).json({ status: 'FORBIDDEN', message: 'Consulta de alertas únicamente' }) }
  if (path.startsWith('/reportes')) return read ? next() : res.status(403).json({ status: 'FORBIDDEN', message: 'Reportes únicamente de lectura' })
  return next()
}
export const actorId = (req) => req.auth.user.id
export { parseCookies }
