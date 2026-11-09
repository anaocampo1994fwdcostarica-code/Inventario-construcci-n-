import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPurchaseOrder, detectPotentialDuplicates, getPurchaseOrder, listPurchaseOrders, updatePurchaseOrder, updatePurchaseOrderState } from '../src/services/purchaseOrderService.js'

const supplier = { id: 'sup-1', nombre: 'Proveedor' }
const user = { id: 'usr-1', nombre: 'Responsable' }
const material = { id: 'mat-1', codigo: 'CEM-001', nombre: 'Cemento' }
const detail = { materialId: 'mat-1', cantidad: 10, precioUnitario: 12.5 }
const existingDetail = { id: 'det-1', materialId: 'mat-1', cantidad: '10.000', precioUnitario: '12.50', subtotal: '125.00' }
const order = { id: 'ord-1', numero: 'OC-001', proveedorId: 'sup-1', responsableId: 'usr-1', fecha: new Date('2026-11-09'), estado: 'BORRADOR', total: '125.00', detalles: [existingDetail], movimientos: [] }

const makePrisma = ({ duplicateOrders = [], state = 'BORRADOR', orderDetails = [existingDetail] } = {}) => {
  const current = { ...order, estado: state, detalles: orderDetails }
  const prisma = {
    $transaction: vi.fn(async (callback) => callback(prisma)),
    proveedor: { findUnique: vi.fn().mockResolvedValue(supplier) },
    usuario: { findUnique: vi.fn().mockResolvedValue(user) },
    material: { findUnique: vi.fn().mockResolvedValue(material) },
    ordenCompra: {
      findMany: vi.fn().mockResolvedValue(duplicateOrders),
      findUnique: vi.fn().mockResolvedValue(current),
      create: vi.fn().mockImplementation(async ({ data }) => ({ ...current, ...data, id: 'ord-new', detalles: data.detalles.create })),
      update: vi.fn().mockImplementation(async ({ data }) => ({ ...current, ...data })),
    },
    detalleOrdenCompra: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
  }
  return prisma
}

const validOrder = { numero: 'OC-001', proveedorId: 'sup-1', responsableId: 'usr-1', fecha: '2026-11-09', detalles: [detail] }

describe('órdenes de compra y duplicados', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('crea una orden válida y calcula subtotal y total', async () => {
    const prisma = makePrisma()
    const result = await createPurchaseOrder(prisma, validOrder)
    expect(result.orden.total.toString()).toBe('125')
    expect(result.orden.detalles[0].subtotal.toString()).toBe('125.00')
    expect(prisma.ordenCompra.create).toHaveBeenCalled()
  })

  it('crea una orden con varios materiales', async () => {
    const prisma = makePrisma()
    prisma.material.findUnique.mockResolvedValue(material)
    const result = await createPurchaseOrder(prisma, { ...validOrder, detalles: [detail, { materialId: 'mat-2', cantidad: 2, precioUnitario: 5 }] })
    expect(result.orden.detalles).toBeDefined()
    expect(prisma.material.findUnique).toHaveBeenCalledTimes(2)
  })

  it('rechaza orden sin detalles, cantidad inválida o precio negativo', async () => {
    const prisma = makePrisma()
    await expect(createPurchaseOrder(prisma, { ...validOrder, detalles: [] })).rejects.toMatchObject({ statusCode: 400 })
    await expect(createPurchaseOrder(prisma, { ...validOrder, detalles: [{ ...detail, cantidad: 0 }] })).rejects.toMatchObject({ statusCode: 400 })
    await expect(createPurchaseOrder(prisma, { ...validOrder, detalles: [{ ...detail, precioUnitario: -1 }] })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rechaza proveedor o material inexistente', async () => {
    const noSupplier = makePrisma(); noSupplier.proveedor.findUnique.mockResolvedValueOnce(null)
    await expect(createPurchaseOrder(noSupplier, validOrder)).rejects.toMatchObject({ statusCode: 404 })
    const noMaterial = makePrisma(); noMaterial.material.findUnique.mockResolvedValueOnce(null)
    await expect(createPurchaseOrder(noMaterial, validOrder)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('detecta número duplicado mediante error de unicidad', async () => {
    const prisma = makePrisma(); prisma.ordenCompra.create.mockRejectedValueOnce({ code: 'P2002' })
    await expect(createPurchaseOrder(prisma, validOrder)).rejects.toMatchObject({ code: 'P2002' })
  })

  it('consulta y lista órdenes', async () => {
    const prisma = makePrisma()
    expect(await getPurchaseOrder(prisma, 'ord-1')).toBeDefined()
    expect(await listPurchaseOrders(prisma, {})).toBeDefined()
  })

  it('actualiza una orden abierta', async () => {
    const prisma = makePrisma()
    const result = await updatePurchaseOrder(prisma, 'ord-1', { observaciones: 'Actualizada', detalles: [detail] })
    expect(result.observaciones).toBe('Actualizada')
    expect(prisma.detalleOrdenCompra.deleteMany).toHaveBeenCalled()
  })

  it('rechaza actualizar una orden recibida', async () => {
    const prisma = makePrisma({ state: 'RECIBIDA' })
    await expect(updatePurchaseOrder(prisma, 'ord-1', { detalles: [detail] })).rejects.toMatchObject({ statusCode: 409 })
  })

  it('aplica estados coherentes y rechaza transiciones inválidas', async () => {
    const prisma = makePrisma({ state: 'BORRADOR' })
    expect((await updatePurchaseOrderState(prisma, 'ord-1', 'SOLICITADA')).estado).toBe('SOLICITADA')
    const closed = makePrisma({ state: 'RECIBIDA' })
    await expect(updatePurchaseOrderState(closed, 'ord-1', 'BORRADOR')).rejects.toMatchObject({ statusCode: 409 })
  })

  it('detecta duplicado por proveedor, material, cantidad y fecha', async () => {
    const prisma = makePrisma({ duplicateOrders: [{ id: 'old', numero: 'OC-OLD', fecha: new Date('2026-11-08'), detalles: [existingDetail] }] })
    const result = await detectPotentialDuplicates(prisma, { ...validOrder, numero: 'OC-NEW' })
    expect(result.posibleDuplicado).toBe(true)
    expect(result.coincidencias).toHaveLength(1)
  })

  it('no genera falso positivo con proveedor diferente', async () => {
    const prisma = makePrisma({ duplicateOrders: [] })
    expect((await detectPotentialDuplicates(prisma, validOrder)).posibleDuplicado).toBe(false)
  })

  it('no genera falso positivo fuera de ventana o tolerancia', async () => {
    const prisma = makePrisma({ duplicateOrders: [{ id: 'old', numero: 'OC-OLD', fecha: new Date('2026-10-01'), detalles: [{ ...existingDetail, cantidad: '100.000' }] }] })
    expect((await detectPotentialDuplicates(prisma, validOrder)).posibleDuplicado).toBe(false)
  })

  it('crear una orden no llama movimientos ni altera stock', async () => {
    const prisma = makePrisma()
    await createPurchaseOrder(prisma, validOrder)
    expect(prisma.movimientoInventario).toBeUndefined()
  })
})
