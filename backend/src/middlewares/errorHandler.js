export const errorHandler = (error, _req, res, _next) => {
  console.error(error)
  if (error.code === 'P2002') return res.status(409).json({ status: 'CONFLICT', message: 'Ya existe un registro con uno de los valores únicos indicados' })
  if (error.code === 'P2003') return res.status(409).json({ status: 'CONFLICT', message: 'El registro tiene relaciones que impiden esta operación' })
  if (error.code === 'P2025') return res.status(404).json({ status: 'NOT_FOUND', message: 'Registro no encontrado' })
  if (error.statusCode) return res.status(error.statusCode).json({ status: error.status || 'ERROR', message: error.message })
  return res.status(500).json({ status: 'ERROR', message: 'Error interno del servidor' })
}
