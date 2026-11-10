import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app.js'

const material = { id: 'mat-1', codigo: 'CEM-001', nombre: 'Cemento', unidadMedida: 'saco', stockMinimo: '10', stockMaximo: '100', demandaDiariaPromedio: '5', demandaDiariaMaxima: '8', tiempoEntregaDias: 3 }
const location = { id: 'loc-1', codigo: 'BOD-001', nombre: 'Bodega central', tipo: 'BODEGA' }
const supplier = { id: 'sup-1', identificacion: 'J-001', nombre: 'Proveedor Uno' }

const makePrisma = () => ({
  material: { findMany: vi.fn().mockResolvedValue([material]), findUnique: vi.fn().mockResolvedValue(material), create: vi.fn().mockImplementation(async ({ data }) => ({ ...material, ...data })), update: vi.fn().mockImplementation(async ({ data }) => ({ ...material, ...data })), delete: vi.fn().mockResolvedValue(material) },
  movimientoInventario: { count: vi.fn().mockResolvedValue(0) },
  detalleOrdenCompra: { count: vi.fn().mockResolvedValue(0) },
  alertaInventario: { count: vi.fn().mockResolvedValue(0) },
  ubicacion: { findMany: vi.fn().mockResolvedValue([location]), findUnique: vi.fn().mockResolvedValue(location), create: vi.fn().mockImplementation(async ({ data }) => ({ ...location, ...data })), update: vi.fn().mockImplementation(async ({ data }) => ({ ...location, ...data })), delete: vi.fn().mockResolvedValue(location) },
  proveedor: { findMany: vi.fn().mockResolvedValue([supplier]), findUnique: vi.fn().mockResolvedValue(supplier), create: vi.fn().mockImplementation(async ({ data }) => ({ ...supplier, ...data })), update: vi.fn().mockImplementation(async ({ data }) => ({ ...supplier, ...data })), delete: vi.fn().mockResolvedValue(supplier) },
  ordenCompra: { count: vi.fn().mockResolvedValue(0) },
})

const validMaterial = { codigo: 'CEM-001', nombre: 'Cemento', unidadMedida: 'saco', stockMinimo: 10, stockMaximo: 100, demandaDiariaPromedio: 5, demandaDiariaMaxima: 8, tiempoEntregaDias: 3 }
const validSupplier = { identificacion: 'J-001', nombre: 'Proveedor Uno', correo: 'proveedor@example.com' }

describe('catálogos de inventario', () => {
  let prisma
  let app

  beforeEach(() => { prisma = makePrisma(); app = createApp({ prisma }) })

  it('crea un material válido', async () => {
    const response = await request(app).post('/api/materiales').send(validMaterial)
    expect(response.status).toBe(201)
    expect(prisma.material.create).toHaveBeenCalled()
  })

  it('rechaza valores negativos de material', async () => {
    const response = await request(app).post('/api/materiales').send({ ...validMaterial, stockMinimo: -1 })
    expect(response.status).toBe(400)
    expect(prisma.material.create).not.toHaveBeenCalled()
  })

  it('rechaza demanda máxima menor que la promedio', async () => {
    const response = await request(app).post('/api/materiales').send({ ...validMaterial, demandaDiariaMaxima: 2 })
    expect(response.status).toBe(400)
  })

  it('rechaza código de material duplicado', async () => {
    prisma.material.create.mockRejectedValueOnce({ code: 'P2002' })
    const response = await request(app).post('/api/materiales').send(validMaterial)
    expect(response.status).toBe(409)
  })

  it('lista y actualiza materiales', async () => {
    expect((await request(app).get('/api/materiales')).status).toBe(200)
    const response = await request(app).put('/api/materiales/mat-1').send({ nombre: 'Cemento gris' })
    expect(response.status).toBe(200)
  })

  it('devuelve 404 para material inexistente', async () => {
    prisma.material.findUnique.mockResolvedValueOnce(null)
    expect((await request(app).get('/api/materiales/no-existe')).status).toBe(404)
  })

  it('crea ubicaciones BODEGA y OBRA y rechaza otro tipo', async () => {
    expect((await request(app).post('/api/ubicaciones').send({ codigo: 'BOD-001', nombre: 'Bodega', tipo: 'BODEGA' })).status).toBe(201)
    expect((await request(app).post('/api/ubicaciones').send({ codigo: 'OBR-001', nombre: 'Obra', tipo: 'OBRA' })).status).toBe(201)
    expect((await request(app).post('/api/ubicaciones').send({ codigo: 'X', nombre: 'Inválida', tipo: 'OTRO' })).status).toBe(400)
  })

  it('crea proveedor y rechaza identificación duplicada', async () => {
    expect((await request(app).post('/api/proveedores').send(validSupplier)).status).toBe(201)
    prisma.proveedor.create.mockRejectedValueOnce({ code: 'P2002' })
    expect((await request(app).post('/api/proveedores').send(validSupplier)).status).toBe(409)
  })

  it('impide eliminar material con movimientos relacionados', async () => {
    prisma.movimientoInventario.count.mockResolvedValueOnce(1)
    const response = await request(app).delete('/api/materiales/mat-1')
    expect(response.status).toBe(409)
    expect(prisma.material.delete).not.toHaveBeenCalled()
  })

  it('impide eliminar proveedor con órdenes de compra', async () => {
    prisma.ordenCompra.count.mockResolvedValueOnce(1)
    const response = await request(app).delete('/api/proveedores/sup-1')
    expect(response.status).toBe(409)
    expect(prisma.proveedor.delete).not.toHaveBeenCalled()
  })
})
