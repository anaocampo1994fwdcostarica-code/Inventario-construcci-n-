export class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.statusCode = 400
    this.status = 'VALIDATION_ERROR'
  }
}

export const requiredString = (value, field) => {
  if (typeof value !== 'string' || !value.trim()) throw new ValidationError(`${field} es obligatorio`)
  return value.trim()
}

export const optionalString = (value) => value == null ? null : requiredString(value, 'El campo')

export const nonNegativeDecimal = (value, field) => {
  const number = Number(value)
  if (value === undefined || value === null || value === '' || !Number.isFinite(number) || number < 0) {
    throw new ValidationError(`${field} debe ser un número mayor o igual a cero`)
  }
  return String(number)
}

export const nonNegativeInteger = (value, field) => {
  const number = Number(value)
  if (!Number.isInteger(number) || number < 0) throw new ValidationError(`${field} debe ser un entero mayor o igual a cero`)
  return number
}

export const buildMaterialData = (body, partial = false) => {
  const data = {}
  const strings = ['codigo', 'nombre', 'unidadMedida']
  for (const field of strings) if (!partial || body[field] !== undefined) data[field] = requiredString(body[field], field)
  if (!partial || body.descripcion !== undefined) data.descripcion = optionalString(body.descripcion)
  const decimals = ['stockMinimo', 'stockMaximo', 'demandaDiariaPromedio', 'demandaDiariaMaxima']
  for (const field of decimals) if (!partial || body[field] !== undefined) data[field] = nonNegativeDecimal(body[field], field)
  if (!partial || body.tiempoEntregaDias !== undefined) data.tiempoEntregaDias = nonNegativeInteger(body.tiempoEntregaDias, 'tiempoEntregaDias')
  const average = Number(data.demandaDiariaPromedio ?? body.demandaDiariaPromedio)
  const maximum = Number(data.demandaDiariaMaxima ?? body.demandaDiariaMaxima)
  if (Number.isFinite(average) && Number.isFinite(maximum) && maximum < average) throw new ValidationError('demandaDiariaMaxima debe ser mayor o igual a demandaDiariaPromedio')
  const min = Number(data.stockMinimo ?? body.stockMinimo)
  const max = Number(data.stockMaximo ?? body.stockMaximo)
  if (Number.isFinite(min) && Number.isFinite(max) && max < min) throw new ValidationError('stockMaximo debe ser mayor o igual a stockMinimo')
  return data
}

export const buildLocationData = (body, partial = false) => {
  const data = {}
  if (!partial || body.codigo !== undefined) data.codigo = requiredString(body.codigo, 'codigo')
  if (!partial || body.nombre !== undefined) data.nombre = requiredString(body.nombre, 'nombre')
  if (!partial || body.tipo !== undefined) {
    if (!['BODEGA', 'OBRA'].includes(body.tipo)) throw new ValidationError('tipo debe ser BODEGA u OBRA')
    data.tipo = body.tipo
  }
  if (!partial || body.direccion !== undefined) data.direccion = optionalString(body.direccion)
  return data
}

export const buildSupplierData = (body, partial = false) => {
  const data = {}
  if (!partial || body.identificacion !== undefined) data.identificacion = requiredString(body.identificacion, 'identificacion')
  if (!partial || body.nombre !== undefined) data.nombre = requiredString(body.nombre, 'nombre')
  for (const field of ['correo', 'telefono', 'direccion']) if (!partial || body[field] !== undefined) data[field] = optionalString(body[field])
  return data
}
