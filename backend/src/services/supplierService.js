import { ValidationError, buildSupplierData } from './catalogValidation.js'

export const listSuppliers = (prisma) => prisma.proveedor.findMany({ orderBy: { nombre: 'asc' } })
export const getSupplier = async (prisma, id) => {
  const item = await prisma.proveedor.findUnique({ where: { id } })
  if (!item) throw Object.assign(new Error('Proveedor no encontrado'), { statusCode: 404, status: 'NOT_FOUND' })
  return item
}
export const createSupplier = (prisma, body) => prisma.proveedor.create({ data: buildSupplierData(body) })
export const updateSupplier = async (prisma, id, body) => { await getSupplier(prisma, id); return prisma.proveedor.update({ where: { id }, data: buildSupplierData(body, true) }) }
export const deleteSupplier = async (prisma, id) => {
  await getSupplier(prisma, id)
  const orders = await prisma.ordenCompra.count({ where: { proveedorId: id } })
  if (orders) throw Object.assign(new ValidationError('No se puede eliminar un proveedor con órdenes de compra'), { statusCode: 409, status: 'CONFLICT' })
  await prisma.proveedor.delete({ where: { id } })
}
