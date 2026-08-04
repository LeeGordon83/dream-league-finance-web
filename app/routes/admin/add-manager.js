const api = require('../../api')
const joi = require('joi')
const { isInRole } = require('../../auth')

const requireAdmin = (request, h) => {
  if (!isInRole(request.auth.credentials, 'admin')) {
    return h.redirect('/').takeover()
  }

  return h.continue
}

module.exports = [{
  method: 'GET',
  path: '/admin/add-manager',
  config: {
    pre: [requireAdmin]
  },
  handler: async (request, h) => {
    return h.view('admin/add-manager')
  }
}, {
  method: 'POST',
  path: '/admin/add-manager',
  options: {
    pre: [requireAdmin],
    validate: {
      payload: joi.object({
        managerName: joi.string().required(),
        primaryEmail: joi.string().trim().email().allow('', null).optional(),
        secondaryEmail: joi.string().trim().email().allow('', null).optional()
      }),
      failAction: async (request, h, error) => {
        return h.view('admin/add-manager', { error, adhoc: request.payload }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      await api.post('/admin/managers/create', request.payload, request.state.dl_token)

      return h.redirect('/admin/managers')
    }
  }
}]
