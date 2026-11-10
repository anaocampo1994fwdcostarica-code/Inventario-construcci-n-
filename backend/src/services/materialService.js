import { ValidationError, buildMaterialData } from './catalogValidation.js'

export const listMaterials = (prisma) => prisma.material.findMany({ orderBy: { codigo: 'asc' } })
export const getMaterial = async (prisma, id) => {
  const item = await prisma.material.findUnique({ where: { id } })
  if (!item) throw Object.assign(new Error('Material no encontrado'), { statusCode: 404, status: 'NOT_FOUND' })
  return item
}
export const createMaterial = (prisma, body) => prisma.material.create({ data: buildMaterialData(body) })
export const updateMaterial = async (prisma, id, body) => {
  await getMaterial(prisma, id)
  return prisma.material.update({ where: { id }, data: buildMaterialData(body, true) })
}
export const deleteMaterial = async (prisma, id) => {
  await getMaterial(prisma, id)
  const [movements, details, alerts] = await Promise.all([
    prisma.movimientoInventario.count({ where: { materialId: id } }),
    prisma.detalleOrdenCompra.count({ where: { materialId: id } }),
    prisma.alertaInventario.count({ where: { materialId: id } }),
  ])
  if (movements || details || alerts) throw Object.assign(new ValidationError('No se puede eliminar un material con historial o relaciones'), { statusCode: 409, status: 'CONFLICT' })
  await prisma.material.delete({ where: { id } })
}
