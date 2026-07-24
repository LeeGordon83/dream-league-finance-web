const Manager = require('../models/manager')
const joi = require('joi')
const mongoose = require('mongoose')

const managerName = (manager) => manager.managerName || manager.ManagerName || ''

const managerEmails = (manager) => {
  if (Array.isArray(manager.emails)) {
    return manager.emails
  }

  if (Array.isArray(manager.Emails)) {
    return manager.Emails
  }

  const list = []
  if (manager.email || manager.Email) {
    list.push({ address: manager.email || manager.Email })
  }

  return list
}

const managerToView = (manager) => ({
  id: String(manager._id || manager.managerId || manager.ManagerId || ''),
  managerId: String(manager.managerId || manager.ManagerId || manager._id || ''),
  name: managerName(manager),
  emails: managerEmails(manager)
})

const managerQueryById = (id) => {
  const query = {
    $or: [
      { managerId: id },
      { ManagerId: id }
    ]
  }

  if (mongoose.Types.ObjectId.isValid(id)) {
    query.$or.push({ _id: id })
  }

  return query
}

const normalizeEmails = (primaryEmail, secondaryEmail) => {
  const emails = []
  if (primaryEmail) {
    emails.push({ address: String(primaryEmail).trim() })
  }

  if (secondaryEmail) {
    emails.push({ address: String(secondaryEmail).trim() })
  }

  return emails
}

module.exports = [{
  method: 'GET',
  path: '/admin/managers',
  config: {},
  handler: async (_request, h) => {
    try {
      const managers = await Manager.find({}).lean()
      const transformedManagers = managers.map(managerToView)

      return h.response(transformedManagers).code(200)
    } catch (error) {
      return h.response({ error: 'Failed to fetch managers' }).code(500)
    }
  }
}, {
  method: 'GET',
  path: '/admin/managers/{managerId}',
  config: {
    validate: {
      params: joi.object({
        managerId: joi.string().required()
      })
    }
  },
  handler: async (request, h) => {
    const { managerId } = request.params
    const manager = await Manager.findOne(managerQueryById(managerId)).lean()

    if (!manager) {
      return h.response({ error: 'Manager not found' }).code(404)
    }

    return h.response(managerToView(manager)).code(200)
  }
}, {
  method: 'POST',
  path: '/admin/managers/create',
  config: {
    validate: {
      payload: joi.object({
        managerName: joi.string().trim().required(),
        primaryEmail: joi.string().email().required(),
        secondaryEmail: joi.string().email().allow('', null)
      })
    }
  },
  handler: async (request, h) => {
    const { managerName: name, primaryEmail, secondaryEmail } = request.payload
    const managerId = String(Date.now())
    const emails = normalizeEmails(primaryEmail, secondaryEmail)

    const manager = await Manager.create({
      managerId,
      managerName: name,
      active: true,
      emails,
      email: String(primaryEmail).trim().toLowerCase()
    })

    return h.response(managerToView(manager)).code(201)
  }
}, {
  method: 'POST',
  path: '/admin/managers/update',
  config: {
    validate: {
      payload: joi.object({
        managerId: joi.string().required(),
        managerName: joi.string().trim().required(),
        primaryEmail: joi.string().email().required(),
        secondaryEmail: joi.string().email().allow('', null)
      })
    }
  },
  handler: async (request, h) => {
    const { managerId, managerName: name, primaryEmail, secondaryEmail } = request.payload
    const emails = normalizeEmails(primaryEmail, secondaryEmail)

    const updated = await Manager.findOneAndUpdate(
      managerQueryById(managerId),
      {
        $set: {
          managerName: name,
          emails,
          email: String(primaryEmail).trim().toLowerCase()
        }
      },
      { new: true }
    ).lean()

    if (!updated) {
      return h.response({ error: 'Manager not found' }).code(404)
    }

    return h.response(managerToView(updated)).code(200)
  }
}, {
  method: 'POST',
  path: '/admin/managers/delete',
  config: {
    validate: {
      payload: joi.object({
        managerId: joi.string().required()
      })
    }
  },
  handler: async (request, h) => {
    const { managerId } = request.payload
    const deleted = await Manager.findOneAndDelete(managerQueryById(managerId)).lean()

    if (!deleted) {
      return h.response({ error: 'Manager not found' }).code(404)
    }

    return h.response({ success: true }).code(200)
  }
}]
