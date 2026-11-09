import { ValidationError, buildLocationData } from './catalogValidation.js'

export const listLocations = (prisma) => prisma.ubicacion.findMany({ orderBy: { codigo: 'asc' } })
export const getLocation = async (prisma, id) => {
  const item = await prisma.ubicacion.findUnique({ where: { id } })
  if (!item) throw Object.assign(new Error('Ubicación no encontrada'), { statusCode: 404, status: 'NOT_FOUND' })
  return item
}
export const createLocation = (prisma, body) => prisma.ubicacion.create({ data: buildLocationData(body) })
export const updateLocation = async (prisma, id, body) => { await getLocation(prisma, id); return prisma.ubicacion.update({ where: { id }, data: buildLocationData(body, true) }) }
export const deleteLocation = async (prisma, id) => {
  await getLocation(prisma, id)
  const [origin, destination, alerts] = await Promise.all([
    prisma.movimientoInventario.count({ where: { ubicacionOrigenId: id } }),
    prisma.movimientoInventario.count({ where: { ubicacionDestinoId: id } }),
    prisma.alertaInventario.count({ where: { ubicacionId: id } }),
  ])
  if (origin || destination || alerts) throw Object.assign(new ValidationError('No se puede eliminar una ubicación con historial o alertas'), { statusCode: 409, status: 'CONFLICT' })
  await prisma.ubicacion.delete({ where: { id } })
}
