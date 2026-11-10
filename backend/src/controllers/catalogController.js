const resourceController = (service) => ({
  list: async (req, res) => res.status(200).json(await service.list(req.app.locals.prisma)),
  get: async (req, res) => res.status(200).json(await service.get(req.app.locals.prisma, req.params.id)),
  create: async (req, res) => res.status(201).json(await service.create(req.app.locals.prisma, req.body)),
  update: async (req, res) => res.status(200).json(await service.update(req.app.locals.prisma, req.params.id, req.body)),
  remove: async (req, res) => { await service.remove(req.app.locals.prisma, req.params.id); return res.status(204).send() },
})

export const materialController = resourceController({ list: materials.listMaterials, get: materials.getMaterial, create: materials.createMaterial, update: materials.updateMaterial, remove: materials.deleteMaterial })
export const locationController = resourceController({ list: locations.listLocations, get: locations.getLocation, create: locations.createLocation, update: locations.updateLocation, remove: locations.deleteLocation })
export const supplierController = resourceController({ list: suppliers.listSuppliers, get: suppliers.getSupplier, create: suppliers.createSupplier, update: suppliers.updateSupplier, remove: suppliers.deleteSupplier })
import * as materials from '../services/materialService.js'
import * as locations from '../services/locationService.js'
import * as suppliers from '../services/supplierService.js'

