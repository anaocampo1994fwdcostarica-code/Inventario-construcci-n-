import 'dotenv/config'
import argon2 from 'argon2'
import { getPrisma, disconnectPrisma } from '../src/db/prisma.js'
import { initializeFirstAdmin } from '../src/services/authInitializer.js'
import { login } from '../src/services/authService.js'

const expected = 'gestion_inventario_construccion_test'
const configured = new URL(process.env.DATABASE_URL)
configured.pathname = `/${expected}`
process.env.DATABASE_URL = configured.toString()
const prisma = getPrisma()
const assert = (condition, message) => { if (!condition) throw new Error(message) }
const base = { identificacion: 'INIT-TEST-ADMIN', nombre: 'Administrador temporal', correo: 'init-test-admin@example.com', password: 'Segura-Init-22!', passwordConfirmation: 'Segura-Init-22!' }

try {
  const database = await prisma.$queryRaw`SELECT DATABASE() AS name`
  assert(database[0].name === expected, 'La prueba no está en la base _test')
  await prisma.sesion.deleteMany({ where: { usuario: { identificacion: base.identificacion } } })
  await prisma.usuario.deleteMany({ where: { identificacion: base.identificacion } })
  const created = await initializeFirstAdmin(prisma, base)
  assert(created.rol === 'ADMINISTRADOR' && created.activo === true && !created.passwordHash, 'Administrador inválido o hash expuesto')
  const stored = await prisma.usuario.findUnique({ where: { id: created.id } })
  assert(stored?.passwordHash?.startsWith('$argon2'), 'El hash no es Argon2id')
  assert(await argon2.verify(stored.passwordHash, base.password), 'El hash no valida la contraseña')
  await assertReject(() => initializeFirstAdmin(prisma, { ...base, identificacion: 'INIT-TEST-SECOND', correo: 'second@example.com' }), 'Segundo inicializador aceptado')
  await assertReject(() => initializeFirstAdmin(prisma, { ...base, password: 'weak', passwordConfirmation: 'weak' }), 'Contraseña débil aceptada')
  await assertReject(() => initializeFirstAdmin(prisma, { ...base, passwordConfirmation: 'Otra-Init-22!' }), 'Confirmación diferente aceptada')
  const developmentUrl = process.env.DATABASE_URL
  process.env.DATABASE_URL = developmentUrl.replace('_test', '')
  await assertReject(() => initializeFirstAdmin(prisma, base), 'Base de desarrollo aceptada')
  process.env.DATABASE_URL = developmentUrl.replace(expected, 'base_desconocida')
  await assertReject(() => initializeFirstAdmin(prisma, base), 'Base desconocida aceptada')
  process.env.DATABASE_URL = developmentUrl
  const auth = await login(prisma, { identificador: base.correo, password: base.password }, 'initializer-test')
  assert(auth.user.rol === 'ADMINISTRADOR' && !auth.user.passwordHash, 'Login temporal inválido')
  await prisma.sesion.deleteMany({ where: { usuarioId: created.id } })
  await prisma.usuario.delete({ where: { id: created.id } })
  const concurrent = await Promise.allSettled([
    initializeFirstAdmin(prisma, { ...base, identificacion: 'INIT-TEST-CONCURRENT-A', correo: 'concurrent-a@example.com' }),
    initializeFirstAdmin(prisma, { ...base, identificacion: 'INIT-TEST-CONCURRENT-B', correo: 'concurrent-b@example.com' }),
  ])
  assert(concurrent.filter((result) => result.status === 'fulfilled').length === 1, 'La concurrencia permitió más de un administrador')
  await prisma.sesion.deleteMany({ where: { usuario: { identificacion: { startsWith: 'INIT-TEST-CONCURRENT-' } } } })
  await prisma.usuario.deleteMany({ where: { identificacion: { startsWith: 'INIT-TEST-CONCURRENT-' } } })
  console.log(JSON.stringify({ database: expected, initialized: true, argon2: true, secondRejected: true, weakRejected: true, mismatchRejected: true, environmentRejected: true, concurrentSingleWinner: true, login: true, cleaned: true }))
} finally {
  await disconnectPrisma()
}

async function assertReject(operation, message) {
  try { await operation() } catch { return }
  throw new Error(message)
}
