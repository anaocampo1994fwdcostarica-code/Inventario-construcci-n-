import { Prisma } from '@prisma/client'

export const calculateStock = (movements, locationId = null) => movements.reduce((stock, movement) => {
  const quantity = new Prisma.Decimal(movement.cantidad)
  if (movement.tipo === 'ENTRADA' && (!locationId || movement.ubicacionDestinoId === locationId)) return stock.plus(quantity)
  if (movement.tipo === 'SALIDA' && (!locationId || movement.ubicacionOrigenId === locationId)) return stock.minus(quantity)
  if (movement.tipo === 'TRASLADO') {
    let result = stock
    if (!locationId || movement.ubicacionOrigenId === locationId) result = result.minus(quantity)
    if (!locationId || movement.ubicacionDestinoId === locationId) result = result.plus(quantity)
    return result
  }
  if (movement.tipo === 'AJUSTE' && (!locationId || movement.ubicacionDestinoId === locationId || movement.ubicacionOrigenId === locationId)) {
    return movement.sentidoAjuste === 'DECREMENTO' ? stock.minus(quantity) : stock.plus(quantity)
  }
  return stock
}, new Prisma.Decimal(0))
