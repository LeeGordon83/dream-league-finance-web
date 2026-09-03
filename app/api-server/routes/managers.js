const Manager = require('../models/manager')
const joi = require('joi')
const mongoose = require('mongoose')
const { requireAdmin } = require('../auth')

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
  const normalizedPrimary = String(primaryEmail || '').trim().toLowerCase()
  const normalizedSecondary = String(secondaryEmail || '').trim().toLowerCase()

  if (normalizedPrimary) {
    emails.push({ address: normalizedPrimary })
  }

  if (normalizedSecondary) {
    emails.push({ address: normalizedSecondary })
  }

  return emails
}

module.exports = [{
  method: 'GET',
  path: '/admin/managers',
  config: {
    auth: 'jwt',
    pre: [requireAdmin]
  },
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
    auth: 'jwt',
    pre: [requireAdmin],
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
    auth: 'jwt',
    pre: [requireAdmin],
    validate: {
      payload: joi.object({
        managerName: joi.string().trim().required(),
        primaryEmail: joi.string().trim().email().allow('', null).optional(),
        secondaryEmail: joi.string().trim().email().allow('', null).optional()
      })
    }
  },
  handler: async (request, h) => {
    const { managerName: name, primaryEmail, secondaryEmail } = request.payload
    const managerId = String(Date.now())
    const emails = normalizeEmails(primaryEmail, secondaryEmail)

    const managerData = {
      managerId,
      managerName: name,
      active: true
    }

    if (emails.length > 0) {
      managerData.emails = emails
    }

    if (emails[0] && emails[0].address) {
      managerData.email = emails[0].address
    }

    const manager = await Manager.create(managerData)

    return h.response(managerToView(manager)).code(201)
  }
}, {
  method: 'POST',
  path: '/admin/managers/update',
  config: {
    auth: 'jwt',
    pre: [requireAdmin],
    validate: {
      payload: joi.object({
        managerId: joi.string().required(),
        managerName: joi.string().trim().required(),
        primaryEmail: joi.string().trim().email().allow('', null).optional(),
        secondaryEmail: joi.string().trim().email().allow('', null).optional(),
        isAdmin: joi.boolean().optional()
      })
    }
  },
  handler: async (request, h) => {
    const { managerId, managerName: name, primaryEmail, secondaryEmail, isAdmin } = request.payload
    const emails = normalizeEmails(primaryEmail, secondaryEmail)
    
    const updateData = {
      $set: {
        managerName: name
      },
      $unset: {
        Email: '',
        Emails: ''
      }
    }

    if (emails.length > 0) {
      updateData.$set.emails = emails
    } else {
      updateData.$unset.emails = ''
    }

    if (emails[0] && emails[0].address) {
      updateData.$set.email = emails[0].address
    } else {
      updateData.$unset.email = ''
    }
    
    if (isAdmin !== undefined) {
      updateData.$set.isAdmin = Boolean(isAdmin)
    }

    const updated = await Manager.findOneAndUpdate(
      managerQueryById(managerId),
      updateData,
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
    auth: 'jwt',
    pre: [requireAdmin],
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
}, {
  method: 'POST',
  path: '/admin/managers/set-admin',
  config: {
    auth: 'jwt',
    pre: [requireAdmin],
    validate: {
      payload: joi.object({
        managerId: joi.string().required(),
        isAdmin: joi.boolean().required()
      })
    }
  },
  handler: async (request, h) => {
    const { managerId, isAdmin } = request.payload
    
    const updated = await Manager.findOneAndUpdate(
      managerQueryById(managerId),
      {
        $set: {
          isAdmin: Boolean(isAdmin)
        }
      },
      { new: true }
    ).lean()

    if (!updated) {
      return h.response({ error: 'Manager not found' }).code(404)
    }

    return h.response(managerToView(updated)).code(200)
  }
}]
