import 'dotenv/config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'
import mariadb from 'mariadb'

let prisma

export const getPrisma = () => {
  if (!prisma) {
    const databaseUrl = new URL(process.env.DATABASE_URL)
    const user = decodeURIComponent(databaseUrl.username)
    const password = decodeURIComponent(databaseUrl.password)
    const adapter = new PrismaMariaDb({
      host: databaseUrl.hostname,
      port: Number(databaseUrl.port || 3306),
      user,
      password,
      database: databaseUrl.pathname.slice(1),
      connectionLimit: 5,
    })
    prisma = new PrismaClient({ adapter })
  }
  return prisma
}

export const disconnectPrisma = async () => {
  if (prisma) {
    await prisma.$disconnect()
    prisma = undefined
  }
}

export const withMaterialLock = async (materialId, operation) => {
  const databaseUrl = new URL(process.env.DATABASE_URL)
  const connection = await mariadb.createConnection({
    host: databaseUrl.hostname,
    port: Number(databaseUrl.port || 3306),
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: databaseUrl.pathname.slice(1),
  })
  const lockName = `inventario:material:${materialId}`
  try {
    const result = await connection.query('SELECT GET_LOCK(?, 10) AS acquired', [lockName])
    if (!result[0] || Number(result[0].acquired) !== 1) throw Object.assign(new Error('No se pudo asegurar el bloqueo del material; intente nuevamente'), { statusCode: 409, status: 'CONFLICT' })
    return await operation()
  } finally {
    try {
      await connection.query('SELECT RELEASE_LOCK(?)', [lockName])
    } finally {
      await connection.end()
    }
  }
}

export const withOrderLock = async (orderId, operation) => {
  const databaseUrl = new URL(process.env.DATABASE_URL)
  const connection = await mariadb.createConnection({
    host: databaseUrl.hostname,
    port: Number(databaseUrl.port || 3306),
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: databaseUrl.pathname.slice(1),
  })
  const lockName = `inventario:orden:${orderId}`
  let acquired = false
  try {
    const result = await connection.query('SELECT GET_LOCK(?, 10) AS acquired', [lockName])
    acquired = Number(result[0]?.acquired) === 1
    if (!acquired) throw Object.assign(new Error('No se pudo asegurar el bloqueo de la orden; intente nuevamente'), { statusCode: 409, status: 'CONFLICT' })
    return await operation()
  } finally {
    try { if (acquired) await connection.query('SELECT RELEASE_LOCK(?)', [lockName]) } finally { await connection.end() }
  }
}
