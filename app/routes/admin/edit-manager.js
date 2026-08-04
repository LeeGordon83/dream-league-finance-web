const joi = require('joi')
const api = require('../../api')
const { isInRole } = require('../../auth')

const requireAdmin = (request, h) => {
  if (!isInRole(request.auth.credentials, 'admin')) {
    return h.redirect('/').takeover()
  }

  return h.continue
}

const toFormModel = (manager) => {
  const emails = Array.isArray(manager.emails) ? manager.emails : []

  return {
    managerId: String(manager.managerId || manager.id || ''),
    managerName: manager.name || '',
    primaryEmail: (emails[0] && emails[0].address) || '',
    secondaryEmail: (emails[1] && emails[1].address) || '',
    isAdmin: Boolean(manager.isAdmin)
  }
}

module.exports = [{
  method: 'GET',
  path: '/admin/edit-manager',
  options: {
    pre: [requireAdmin],
    validate: {
      query: joi.object({
        managerId: joi.string().required()
      })
    },
    handler: async (request, h) => {
      const manager = await api.get(`/admin/managers/${request.query.managerId}`, request.dl_token)
      return h.view('admin/edit-manager', toFormModel(manager))
    }
  }
}, {
  method: 'POST',
  path: '/admin/edit-manager',
  options: {
    pre: [requireAdmin],
    validate: {
      payload: joi.object({
        managerId: joi.string().required(),
        managerName: joi.string().required(),
        primaryEmail: joi.string().trim().email().allow('', null).optional(),
        secondaryEmail: joi.string().trim().email().allow('', null).optional(),
        isAdmin: joi.boolean().optional()
      }),
      failAction: async (request, h, error) => {
        return h.view('admin/edit-manager', {
          ...request.payload,
          message: 'Please check the manager details and try again.',
          error
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const payload = {
        managerId: request.payload.managerId,
        managerName: request.payload.managerName,
        primaryEmail: request.payload.primaryEmail,
        secondaryEmail: request.payload.secondaryEmail
      }
      if (request.payload.isAdmin !== undefined) {
        payload.isAdmin = Boolean(request.payload.isAdmin)
      }
      await api.post('/admin/managers/update', payload, request.dl_token)
      return h.redirect('/admin/managers')
    }
  }
}]
