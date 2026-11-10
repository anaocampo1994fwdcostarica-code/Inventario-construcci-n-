import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app.js'

const user = { id: 'u1', identificacion: '100', nombre: 'Ana', correo: 'ana@example.com', rol: 'ADMINISTRADOR', activo: true }
const payload = { ...user, password: 'Contraseña-Segura-21!' }

const prisma = {
  usuario: {
    findMany: vi.fn().mockResolvedValue([user]),
    findUnique: vi.fn().mockResolvedValue(user),
    create: vi.fn().mockResolvedValue(user),
    update: vi.fn().mockResolvedValue({ ...user, nombre: 'Ana Actualizada' }),
  },
}

describe('API de usuarios', () => {
  it('lista y consulta usuarios sin campos sensibles', async () => {
    const app = createApp({ prisma })
    expect((await request(app).get('/api/usuarios')).status).toBe(200)
    const response = await request(app).get('/api/usuarios/u1')
    expect(response.status).toBe(200)
    expect(response.body).not.toHaveProperty('password')
    expect(response.body).not.toHaveProperty('token')
  })

  it('crea y actualiza un usuario válido', async () => {
    const app = createApp({ prisma })
    expect((await request(app).post('/api/usuarios').send(payload)).status).toBe(201)
    expect((await request(app).put('/api/usuarios/u1').send({ nombre: 'Ana Actualizada' })).status).toBe(200)
  })

  it('rechaza correo y rol inválidos', async () => {
    const app = createApp({ prisma })
    expect((await request(app).post('/api/usuarios').send({ ...payload, correo: 'no-es-correo' })).status).toBe(400)
    expect((await request(app).post('/api/usuarios').send({ ...payload, rol: 'ROOT' })).status).toBe(400)
  })

  it('mapea duplicados Prisma como conflicto', async () => {
    prisma.usuario.create.mockRejectedValueOnce({ code: 'P2002' })
    const app = createApp({ prisma })
    expect((await request(app).post('/api/usuarios').send(payload)).status).toBe(409)
  })
})
