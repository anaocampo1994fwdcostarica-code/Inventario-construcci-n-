import * as users from '../services/userService.js'

export const userController = {
  list: async (req, res) => res.status(200).json(await users.listUsers(req.app.locals.prisma)),
  get: async (req, res) => res.status(200).json(await users.getUser(req.app.locals.prisma, req.params.id)),
  create: async (req, res) => res.status(201).json(await users.createUser(req.app.locals.prisma, req.body)),
  update: async (req, res) => res.status(200).json(await users.updateUser(req.app.locals.prisma, req.params.id, req.body)),
}
