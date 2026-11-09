import { Prisma } from '@prisma/client'
import { calculateStock } from './stockCalculator.js'

const stockNumber = (value) => Number(new Prisma.Decimal(value).toFixed(3))

export const listStock = async (prisma, query) => {
  const materials = await prisma.material.findMany({ where: query.materialId ? { id: query.materialId } : {}, orderBy: { codigo: 'asc' } })
  const movements = await prisma.movimientoInventario.findMany({ where: query.materialId ? { materialId: query.materialId } : {} })
  const locations = query.ubicacionId ? await prisma.ubicacion.findMany({ where: { id: query.ubicacionId } }) : await prisma.ubicacion.findMany({ orderBy: { codigo: 'asc' } })
  return materials.flatMap((material) => {
    const materialMovements = movements.filter((movement) => movement.materialId === material.id)
    const rows = locations.map((location) => ({ materialId: material.id, codigo: material.codigo, material: material.nombre, ubicacionId: location.id, ubicacion: location.nombre, tipoUbicacion: location.tipo, stock: stockNumber(calculateStock(materialMovements, location.id)) }))
    const global = { materialId: material.id, codigo: material.codigo, material: material.nombre, ubicacionId: null, ubicacion: 'GLOBAL', tipoUbicacion: null, stock: stockNumber(calculateStock(materialMovements)) }
    return query.ubicacionId ? rows : [global, ...rows]
  })
}

export const stockByMaterial = async (prisma, materialId, query) => {
  const material = await prisma.material.findUnique({ where: { id: materialId } })
  if (!material) throw Object.assign(new Error('Material no encontrado'), { statusCode: 404, status: 'NOT_FOUND' })
  return listStock(prisma, { ...query, materialId })
}
