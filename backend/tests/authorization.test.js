import { describe, expect, it, vi } from 'vitest'
import { authorizeRequest, requirePermission } from '../src/middlewares/auth.js'

const run = (middleware, auth, path, method = 'GET') => {
  const req = { path, method, auth }
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
  const next = vi.fn()
  middleware(req, res, next)
  return { res, next }
}

describe('autorización por rol', () => {
  it('rechaza sin sesión con 401', () => {
    const { res, next } = run(requirePermission('ADMINISTRADOR'), null, '/usuarios')
    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('rechaza al bodeguero en gestión de usuarios con 403', () => {
    const { res, next } = run(authorizeRequest, { user: { rol: 'ENCARGADO_BODEGA' } }, '/usuarios', 'POST')
    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('permite al bodeguero consultar y registrar movimientos', () => {
    const auth = { user: { rol: 'ENCARGADO_BODEGA' } }
    expect(run(authorizeRequest, auth, '/materiales').next).toHaveBeenCalled()
    expect(run(authorizeRequest, auth, '/movimientos', 'POST').next).toHaveBeenCalled()
  })

  it('reserva cambios de estado y evaluación de alertas al administrador', () => {
    const auth = { user: { rol: 'ENCARGADO_BODEGA' } }
    expect(run(authorizeRequest, auth, '/ordenes-compra/o1/estado', 'PATCH').res.status).toHaveBeenCalledWith(403)
    expect(run(authorizeRequest, auth, '/alertas/evaluar', 'POST').res.status).toHaveBeenCalledWith(403)
    expect(run(authorizeRequest, { user: { rol: 'ADMINISTRADOR' } }, '/alertas/evaluar', 'POST').next).toHaveBeenCalled()
  })
})
