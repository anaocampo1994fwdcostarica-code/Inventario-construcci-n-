import { csrfToken, login, logout } from '../services/authService.js'
const ttl = () => Number(process.env.SESSION_TTL_MINUTES || 60)
const secure = () => process.env.NODE_ENV === 'production' ? '; Secure' : ''
export const authController = {
  login: async (req, res) => { const result = await login(req.app.locals.prisma, req.body, req.ip); res.setHeader('Set-Cookie', [`sid=${result.token}; Max-Age=${ttl() * 60}; Path=/; HttpOnly; SameSite=Lax${secure()}`, `csrf=${csrfToken()}; Max-Age=${ttl() * 60}; Path=/; SameSite=Lax${secure()}`]); return res.status(200).json({ user: result.user, expires: result.expires }) },
  me: async (req, res) => res.status(200).json(req.auth.user),
  logout: async (req, res) => { await logout(req.app.locals.prisma, req.auth.session.id); res.setHeader('Set-Cookie', ['sid=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax', 'csrf=; Max-Age=0; Path=/; SameSite=Lax']); return res.status(204).send() },
}
