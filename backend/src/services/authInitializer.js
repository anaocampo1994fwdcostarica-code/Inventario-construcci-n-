import argon2 from 'argon2'
import mariadb from 'mariadb'
import { buildUserData } from './userService.js'
import { ValidationError, requiredString } from './catalogValidation.js'

const TEST_DATABASE = 'gestion_inventario_construccion_test'
const DEVELOPMENT_DATABASE = 'gestion_inventario_construccion'
const LOCK_NAME = 'inventario:auth:first-admin'

const connectionFromEnv = ({ allowDevelopment = false } = {}) => {
  const url = new URL(process.env.DATABASE_URL)
  const database = decodeURIComponent(url.pathname.slice(1))
  const allowed = database === TEST_DATABASE || (allowDevelopment && database === DEVELOPMENT_DATABASE)
  if (!allowed) throw new Error(`Inicialización bloqueada: base no autorizada (${database || 'sin nombre'})`)
  return { host: url.hostname, port: Number(url.port || 3306), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database }
}

export const validateAdminInput = (input = {}) => {
  const password = requiredString(input.password, 'password')
  const confirmation = requiredString(input.passwordConfirmation, 'passwordConfirmation')
  if (password !== confirmation) throw new ValidationError('La contraseña y su confirmación no coinciden')
  if (password.length < 12 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    throw new ValidationError('La contraseña debe tener al menos 12 caracteres, mayúscula, minúscula, número y símbolo')
  }
  return { ...buildUserData({ ...input, rol: 'ADMINISTRADOR', activo: true }), password }
}

export const initializeFirstAdmin = async (prisma, input, options = {}) => {
  const data = validateAdminInput(input)
  const config = connectionFromEnv(options)
  const connection = await mariadb.createConnection(config)
  let acquired = false
  try {
    const lock = await connection.query('SELECT GET_LOCK(?, 10) AS acquired', [LOCK_NAME])
    acquired = Number(lock[0]?.acquired) === 1
    if (!acquired) throw Object.assign(new Error('No se pudo obtener el bloqueo de inicialización'), { statusCode: 409 })
    const count = await prisma.usuario.count()
    if (count !== 0) throw Object.assign(new Error('La inicialización solo está permitida cuando no existen usuarios'), { statusCode: 409 })
    const passwordHash = await argon2.hash(data.password)
    const user = await prisma.usuario.create({ data: { identificacion: data.identificacion, nombre: data.nombre, correo: data.correo, rol: 'ADMINISTRADOR', activo: true, passwordHash }, select: { id: true, identificacion: true, nombre: true, correo: true, rol: true, activo: true } })
    return user
  } finally {
    try { if (acquired) await connection.query('SELECT RELEASE_LOCK(?)', [LOCK_NAME]) } finally { await connection.end() }
  }
}

export const authorizedDatabase = TEST_DATABASE
export const developmentDatabase = DEVELOPMENT_DATABASE
