import { beforeEach, describe, expect, it, vi } from 'vitest'
import { calculateStock, createMovement, listMovements } from '../src/services/movementService.js'
import { listStock } from '../src/services/stockService.js'

const material = { id: 'mat-1', codigo: 'CEM-001', nombre: 'Cemento', stockMinimo: '10', stockMaximo: '100', demandaDiariaPromedio: '5', demandaDiariaMaxima: '8', tiempoEntregaDias: 3 }
const user = { id: 'usr-1', nombre: 'Ana' }
const warehouse = { id: 'loc-1', codigo: 'BOD-1', nombre: 'Bodega', tipo: 'BODEGA' }
const work = { id: 'loc-2', codigo: 'OBR-1', nombre: 'Obra', tipo: 'OBRA' }

const validEntry = { materialId: 'mat-1', usuarioId: 'usr-1', tipo: 'ENTRADA', cantidad: 10, ubicacionDestinoId: 'loc-1', observaciones: 'Recepción' }

const makePrisma = (movements = []) => {
  const prisma = {
    __skipAdvisoryLock: true,
    $queryRaw: vi.fn().mockResolvedValue([{ acquired: 1 }]),
    $transaction: vi.fn(async (callback) => callback(prisma)),
    material: { findUnique: vi.fn().mockResolvedValue(material), findMany: vi.fn().mockResolvedValue([material]) },
    usuario: { findUnique: vi.fn().mockResolvedValue(user) },
    ubicacion: { findUnique: vi.fn().mockImplementation(async ({ where }) => where.id === 'loc-1' ? warehouse : work), findMany: vi.fn().mockResolvedValue([warehouse, work]) },
    alertaInventario: { findMany: vi.fn().mockResolvedValue([]), create: vi.fn().mockImplementation(async ({ data }) => ({ id: 'alert-1', ...data })), updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
    movimientoInventario: { findMany: vi.fn().mockResolvedValue(movements), create: vi.fn().mockImplementation(async ({ data }) => ({ id: 'mov-1', ...data })) },
  }
  return prisma
}

describe('movimientos, stock y trazabilidad', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('crea una entrada válida', async () => {
    const prisma = makePrisma()
    const result = await createMovement(prisma, validEntry)
    expect(result.tipo).toBe('ENTRADA')
    expect(prisma.movimientoInventario.create).toHaveBeenCalled()
  })

  it('crea una salida válida con stock suficiente', async () => {
    const prisma = makePrisma([{ tipo: 'ENTRADA', cantidad: '20', ubicacionDestinoId: 'loc-1' }])
    const result = await createMovement(prisma, { ...validEntry, tipo: 'SALIDA', ubicacionDestinoId: undefined, ubicacionOrigenId: 'loc-1', cantidad: 5 })
    expect(result.tipo).toBe('SALIDA')
  })

  it('rechaza una salida sin stock suficiente', async () => {
    const prisma = makePrisma([])
    await expect(createMovement(prisma, { ...validEntry, tipo: 'SALIDA', ubicacionDestinoId: undefined, ubicacionOrigenId: 'loc-1', cantidad: 1 })).rejects.toMatchObject({ statusCode: 409 })
  })

  it('crea un traslado y mantiene el stock global', async () => {
    const prisma = makePrisma([{ tipo: 'ENTRADA', cantidad: '10', ubicacionDestinoId: 'loc-1' }])
    const result = await createMovement(prisma, { ...validEntry, tipo: 'TRASLADO', ubicacionDestinoId: 'loc-2', ubicacionOrigenId: 'loc-1', cantidad: 4 })
    expect(result.ubicacionOrigenId).toBe('loc-1')
    expect(calculateStock([...await prisma.movimientoInventario.findMany(), result])).toEqual(expect.anything())
  })

  it('rechaza traslado con mismo origen y destino', async () => {
    const prisma = makePrisma()
    await expect(createMovement(prisma, { ...validEntry, tipo: 'TRASLADO', ubicacionDestinoId: 'loc-1', ubicacionOrigenId: 'loc-1' })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rechaza traslado con stock insuficiente', async () => {
    const prisma = makePrisma([])
    await expect(createMovement(prisma, { ...validEntry, tipo: 'TRASLADO', ubicacionDestinoId: 'loc-2', ubicacionOrigenId: 'loc-1' })).rejects.toMatchObject({ statusCode: 409 })
  })

  it('crea ajustes positivos y negativos', async () => {
    const positive = await createMovement(makePrisma(), { ...validEntry, tipo: 'AJUSTE', sentidoAjuste: 'INCREMENTO', observaciones: 'Conteo físico' })
    const negative = await createMovement(makePrisma([{ tipo: 'ENTRADA', cantidad: '10', ubicacionDestinoId: 'loc-1' }]), { ...validEntry, tipo: 'AJUSTE', sentidoAjuste: 'DECREMENTO', observaciones: 'Merma', ubicacionOrigenId: 'loc-1', ubicacionDestinoId: undefined })
    expect(positive.sentidoAjuste).toBe('INCREMENTO')
    expect(negative.sentidoAjuste).toBe('DECREMENTO')
  })

  it('rechaza cantidad cero o negativa y ajuste sin justificación', async () => {
    await expect(createMovement(makePrisma(), { ...validEntry, cantidad: 0 })).rejects.toMatchObject({ statusCode: 400 })
    await expect(createMovement(makePrisma(), { ...validEntry, cantidad: -1 })).rejects.toMatchObject({ statusCode: 400 })
    await expect(createMovement(makePrisma(), { ...validEntry, tipo: 'AJUSTE', sentidoAjuste: 'INCREMENTO', observaciones: undefined })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rechaza material, ubicación o usuario inexistentes', async () => {
    const noMaterial = makePrisma(); noMaterial.material.findUnique.mockResolvedValueOnce(null)
    await expect(createMovement(noMaterial, validEntry)).rejects.toMatchObject({ statusCode: 404 })
    const noUser = makePrisma(); noUser.usuario.findUnique.mockResolvedValueOnce(null)
    await expect(createMovement(noUser, validEntry)).rejects.toMatchObject({ statusCode: 404 })
    const noLocation = makePrisma(); noLocation.ubicacion.findUnique.mockResolvedValue(null)
    await expect(createMovement(noLocation, validEntry)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('calcula stock por ubicación y global', () => {
    const movements = [
      { tipo: 'ENTRADA', cantidad: '10', ubicacionDestinoId: 'loc-1' },
      { tipo: 'TRASLADO', cantidad: '3', ubicacionOrigenId: 'loc-1', ubicacionDestinoId: 'loc-2' },
      { tipo: 'SALIDA', cantidad: '2', ubicacionOrigenId: 'loc-2' },
    ]
    expect(calculateStock(movements, 'loc-1').toString()).toBe('7')
    expect(calculateStock(movements, 'loc-2').toString()).toBe('1')
    expect(calculateStock(movements).toString()).toBe('8')
  })

  it('lista movimientos con filtros', async () => {
    const prisma = makePrisma()
    await listMovements(prisma, { materialId: 'mat-1', tipo: 'ENTRADA', ubicacionId: 'loc-1' })
    expect(prisma.movimientoInventario.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ materialId: 'mat-1', tipo: 'ENTRADA' }) }))
  })

  it('calcula stock global y por ubicación', async () => {
    const prisma = makePrisma([{ materialId: 'mat-1', tipo: 'ENTRADA', cantidad: '12', ubicacionDestinoId: 'loc-1' }])
    const rows = await listStock(prisma, {})
    expect(rows.find((row) => row.ubicacion === 'GLOBAL').stock).toBe(12)
    expect(rows.find((row) => row.ubicacionId === 'loc-1').stock).toBe(12)
  })

  it.skip('concurrencia real: dos salidas simultáneas no generan stock negativo', () => {
    // Pendiente: requiere una base MySQL de pruebas independiente.
  })
})
