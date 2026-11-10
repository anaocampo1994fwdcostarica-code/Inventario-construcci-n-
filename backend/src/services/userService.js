import { ValidationError, requiredString } from './catalogValidation.js'
import argon2 from 'argon2'

const roles = ['ADMINISTRADOR', 'ENCARGADO_BODEGA', 'SUPERVISOR_OBRA', 'CONSULTA']

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const buildUserData = (body, partial = false) => {
  const data = {}
  for (const field of ['identificacion', 'nombre', 'correo']) {
    if (!partial || body[field] !== undefined) data[field] = requiredString(body[field], field)
  }
  if (data.correo && !emailPattern.test(data.correo)) throw new ValidationError('correo debe tener un formato válido')
  if (!partial || body.rol !== undefined) {
    if (!roles.includes(body.rol)) throw new ValidationError(`rol debe ser uno de: ${roles.join(', ')}`)
    data.rol = body.rol
  }
  if (body.activo !== undefined) {
    if (typeof body.activo !== 'boolean') throw new ValidationError('activo debe ser booleano')
    data.activo = body.activo
  }
  return data
}

const publicSelect = { id: true, identificacion: true, nombre: true, correo: true, rol: true, activo: true, createdAt: true, updatedAt: true }

export const listUsers = (prisma) => prisma.usuario.findMany({ select: publicSelect, orderBy: { nombre: 'asc' } })

export const getUser = async (prisma, id) => {
  const user = await prisma.usuario.findUnique({ where: { id }, select: publicSelect })
  if (!user) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404, status: 'NOT_FOUND' })
  return user
}

export const createUser = async (prisma, body) => {
  const password = requiredString(body.password, 'password')
  if (password.length < 12) throw new ValidationError('password debe tener al menos 12 caracteres')
  return prisma.usuario.create({ data: { ...buildUserData(body), passwordHash: await argon2.hash(password) }, select: publicSelect })
}

export const updateUser = async (prisma, id, body) => {
  await getUser(prisma, id)
  const data = buildUserData(body, true)
  if (body.password !== undefined) { const password = requiredString(body.password, 'password'); if (password.length < 12) throw new ValidationError('password debe tener al menos 12 caracteres'); data.passwordHash = await argon2.hash(password) }
  return prisma.usuario.update({ where: { id }, data, select: publicSelect })
}
