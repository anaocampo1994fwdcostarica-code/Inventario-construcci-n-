import crypto from 'node:crypto'
import argon2 from 'argon2'
import { requiredString } from './catalogValidation.js'

const SESSION_MINUTES = Number(process.env.SESSION_TTL_MINUTES || 60)
const publicUser = { id: true, identificacion: true, nombre: true, correo: true, rol: true, activo: true, ultimoLoginAt: true }
const attempts = new Map()
const profiles = { ADMINISTRADOR: 'ADMINISTRADOR', ENCARGADO_BODEGA: 'EMPLEADO', SUPERVISOR_OBRA: 'EMPLEADO', CONSULTA: 'EMPLEADO' }
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex')
const userView = (user) => ({ id: user.id, identificacion: user.identificacion, nombre: user.nombre, correo: user.correo, rol: user.rol, activo: user.activo, ultimoLoginAt: user.ultimoLoginAt, perfil: profiles[user.rol] || 'EMPLEADO' })

export const login = async (prisma, body, ip = 'unknown') => {
  const identifier = requiredString(body.identificador || body.correo, 'identificador').toLowerCase(); const password = requiredString(body.password, 'password'); const current = attempts.get(ip)
  if (current?.blockedUntil > Date.now()) throw Object.assign(new Error('Demasiados intentos. Intente más tarde'), { statusCode: 429, status: 'RATE_LIMITED' })
  const user = await prisma.usuario.findFirst({ where: { OR: [{ correo: identifier }, { identificacion: identifier }] } }); const valid = user?.passwordHash ? await argon2.verify(user.passwordHash, password) : false
  if (!user || !valid || !user.activo) { const count = (current?.count || 0) + 1; attempts.set(ip, { count, blockedUntil: count >= 5 ? Date.now() + 15 * 60_000 : 0 }); if (user) await prisma.usuario.update({ where: { id: user.id }, data: { intentosFallidos: { increment: 1 } } }); throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401, status: 'UNAUTHORIZED' }) }
  attempts.delete(ip); const token = crypto.randomBytes(32).toString('hex'); const expires = new Date(Date.now() + SESSION_MINUTES * 60_000); await prisma.usuario.update({ where: { id: user.id }, data: { intentosFallidos: 0, bloqueadoHasta: null, ultimoLoginAt: new Date() } }); await prisma.sesion.create({ data: { usuarioId: user.id, tokenHash: hashToken(token), expiraAt: expires } }); return { token, expires, user: userView({ ...user, ultimoLoginAt: new Date() }) }
}
export const getSession = async (prisma, token) => { if (!token) return null; const session = await prisma.sesion.findUnique({ where: { tokenHash: hashToken(token) }, include: { usuario: { select: publicUser } } }); if (!session || session.revocadaAt || session.expiraAt <= new Date() || !session.usuario.activo) return null; return { session, user: userView(session.usuario) } }
export const logout = (prisma, sessionId) => prisma.sesion.update({ where: { id: sessionId }, data: { revocadaAt: new Date() } })
export const csrfToken = () => crypto.randomBytes(24).toString('hex')
