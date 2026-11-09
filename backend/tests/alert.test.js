import { describe, expect, it, vi } from 'vitest'
import { calculateReorder, evaluateAlerts, getAlert, listAlerts, listReorder, updateAlertState } from '../src/services/alertService.js'

const material = { id: 'mat-1', codigo: 'CEM-001', nombre: 'Cemento', stockMinimo: '10', stockMaximo: '100', demandaDiariaPromedio: '5', demandaDiariaMaxima: '8', tiempoEntregaDias: 3 }
const location = { id: 'loc-1', codigo: 'BOD-1', nombre: 'Bodega', tipo: 'BODEGA' }
const makePrisma = ({ stock = [], active = [] } = {}) => {
  const prisma = {
    $transaction: vi.fn(async (callback) => callback(prisma)),
    material: { findMany: vi.fn().mockResolvedValue([material]), findUnique: vi.fn().mockResolvedValue(material) },
    ubicacion: { findMany: vi.fn().mockResolvedValue([location]) },
    movimientoInventario: { findMany: vi.fn().mockResolvedValue(stock) },
    alertaInventario: { findMany: vi.fn().mockResolvedValue(active), findUnique: vi.fn().mockResolvedValue({ id: 'alert-1', material, ubicacion: location, estado: 'ACTIVA', tipo: 'PUNTO_REORDEN' }), create: vi.fn().mockImplementation(async ({ data }) => ({ id: 'alert-1', ...data })), update: vi.fn().mockImplementation(async ({ data }) => ({ id: 'alert-1', ...data })), updateMany: vi.fn().mockResolvedValue({ count: active.length }) },
  }
  return prisma
}

describe('alertas y puntos de reorden', () => {
  it('calcula stock de seguridad y punto de reorden con Decimal', () => {
    const result = calculateReorder(material)
    expect(result.stockSeguridad.toString()).toBe('9')
    expect(result.puntoReorden.toString()).toBe('24')
  })

  it('devuelve reorden para stock superior, igual e inferior', async () => {
    const high = makePrisma({ stock: [{ tipo: 'ENTRADA', cantidad: '30', ubicacionDestinoId: 'loc-1' }] })
    expect((await listReorder(high, {}))[0].stock.toString()).toBe('30')
    const equal = makePrisma({ stock: [{ tipo: 'ENTRADA', cantidad: '24', ubicacionDestinoId: 'loc-1' }] })
    expect((await listReorder(equal, {}))[0].puntoReorden.toString()).toBe('24')
    const low = makePrisma({ stock: [{ tipo: 'ENTRADA', cantidad: '10', ubicacionDestinoId: 'loc-1' }] })
    expect((await listReorder(low, {}))[0].stock.toString()).toBe('10')
  })

  it('genera una alerta de punto de reorden', async () => {
    const prisma = makePrisma({ stock: [{ tipo: 'ENTRADA', cantidad: '10', ubicacionDestinoId: 'loc-1' }] })
    const result = await evaluateAlerts(prisma, {})
    expect(result[0].alertaCreada).toBe(true)
    expect(prisma.alertaInventario.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ tipo: 'PUNTO_REORDEN' }) }))
  })

  it('evita alertas duplicadas y la evaluación es idempotente', async () => {
    const active = [{ id: 'a1', tipo: 'PUNTO_REORDEN', estado: 'ACTIVA' }]
    const prisma = makePrisma({ stock: [], active })
    const result = await evaluateAlerts(prisma, {})
    expect(result[0].alertaCreada).toBe(false)
    expect(prisma.alertaInventario.create).not.toHaveBeenCalled()
  })

  it('resuelve una alerta cuando desaparece la condición', async () => {
    const prisma = makePrisma({ stock: [{ tipo: 'ENTRADA', cantidad: '40', ubicacionDestinoId: 'loc-1' }], active: [{ id: 'a1', tipo: 'PUNTO_REORDEN', estado: 'ACTIVA' }] })
    await evaluateAlerts(prisma, {})
    expect(prisma.alertaInventario.updateMany).toHaveBeenCalled()
  })

  it('lista alertas con filtros y actualiza su estado', async () => {
    const prisma = makePrisma()
    await listAlerts(prisma, { materialId: 'mat-1', ubicacionId: 'loc-1', tipo: 'PUNTO_REORDEN', estado: 'ACTIVA' })
    expect(prisma.alertaInventario.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ materialId: 'mat-1', ubicacionId: 'loc-1' }) }))
    expect((await getAlert(prisma, 'alert-1')).id).toBe('alert-1')
    expect((await updateAlertState(prisma, 'alert-1', 'ATENDIDA')).estado).toBe('ATENDIDA')
  })

  it('rechaza material o ubicación inexistente al evaluar', async () => {
    const noMaterial = makePrisma(); noMaterial.material.findMany.mockResolvedValue([])
    await expect(evaluateAlerts(noMaterial, { materialId: 'missing' })).rejects.toMatchObject({ statusCode: 404 })
    const noLocation = makePrisma(); noLocation.ubicacion.findMany.mockResolvedValue([])
    await expect(evaluateAlerts(noLocation, { ubicacionId: 'missing' })).rejects.toMatchObject({ statusCode: 404 })
  })

  it('evalúa origen y destino de un traslado mediante el contexto recibido', async () => {
    const prisma = makePrisma()
    const result = await evaluateAlerts(prisma, { materialId: 'mat-1', ubicacionId: 'loc-1' })
    expect(result).toHaveLength(1)
  })
})
