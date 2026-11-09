import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../src/app.js'

describe('API base', () => {
  it('GET /api/health devuelve 200 y status OK', async () => {
    const response = await request(app).get('/api/health')
    expect(response.status).toBe(200)
    expect(response.body.status).toBe('OK')
  })

  it('ruta inexistente devuelve 404', async () => {
    const response = await request(app).get('/api/no-existe')
    expect(response.status).toBe(404)
  })
})
