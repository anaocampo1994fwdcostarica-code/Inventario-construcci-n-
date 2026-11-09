import 'dotenv/config'
import readline from 'node:readline'
import { getPrisma, disconnectPrisma } from '../src/db/prisma.js'
import { developmentDatabase, initializeFirstAdmin, authorizedDatabase } from '../src/services/authInitializer.js'

const ask = (question) => new Promise((resolve) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  rl.question(question, (answer) => { rl.close(); resolve(answer.trim()) })
})

const secret = (question) => new Promise((resolve, reject) => {
  process.stdout.write(question)
  const input = process.stdin
  let value = ''
  const onData = (chunk) => {
    const text = chunk.toString()
    if (text === '\r' || text === '\n') { input.setRawMode(false); input.pause(); input.removeListener('data', onData); process.stdout.write('\n'); resolve(value); return }
    if (text === '\u0003') { input.setRawMode(false); input.pause(); input.removeListener('data', onData); reject(new Error('Operación cancelada')); return }
    if (text === '\u007f') value = value.slice(0, -1); else value += text
  }
  input.resume(); input.setRawMode(true); input.on('data', onData)
})

try {
  const allowDevelopment = process.argv.includes('--development')
  const configured = new URL(process.env.DATABASE_URL)
  const database = decodeURIComponent(configured.pathname.slice(1))
  console.log(`Base de destino: ${database || '(sin nombre)'}`)
  const expected = allowDevelopment ? developmentDatabase : authorizedDatabase
  if (database !== expected) throw new Error(`El inicializador no está habilitado para ${database || 'esta base'}`)
  const confirmation = await ask(`Escriba ${expected} para confirmar: `)
  if (confirmation !== expected) throw new Error('Confirmación no válida')
  if (allowDevelopment) {
    const explicit = await ask('Escriba CREAR PRIMER ADMINISTRADOR EN DESARROLLO para confirmar la operación: ')
    if (explicit !== 'CREAR PRIMER ADMINISTRADOR EN DESARROLLO') throw new Error('Confirmación de desarrollo no válida')
  }
  const input = { identificacion: await ask('Identificación: '), nombre: await ask('Nombre: '), correo: await ask('Correo: '), password: await secret('Contraseña (oculta): '), passwordConfirmation: await secret('Confirme la contraseña (oculta): ') }
  const user = await initializeFirstAdmin(getPrisma(), input, { allowDevelopment })
  console.log(`Administrador creado: ${user.identificacion} (${user.id})`)
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  await disconnectPrisma()
}
