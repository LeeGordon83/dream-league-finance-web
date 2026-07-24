const joi = require('joi')
const api = require('../../api')

const toFormModel = (manager) => {
  const emails = Array.isArray(manager.emails) ? manager.emails : []

  return {
    managerId: String(manager.managerId || manager.id || ''),
    managerName: manager.name || '',
    primaryEmail: (emails[0] && emails[0].address) || '',
    secondaryEmail: (emails[1] && emails[1].address) || ''
  }
}

module.exports = [{
  method: 'GET',
  path: '/admin/edit-manager',
  options: {
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
    validate: {
      payload: joi.object({
        managerId: joi.string().required(),
        managerName: joi.string().required(),
        primaryEmail: joi.string().email().required(),
        secondaryEmail: joi.string().email().allow('', null)
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
      await api.post('/admin/managers/update', request.payload, request.dl_token)
      return h.redirect('/admin/managers')
    }
  }
}]
