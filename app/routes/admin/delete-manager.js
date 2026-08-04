const joi = require('joi')
const api = require('../../api')
const { isInRole } = require('../../auth')

const requireAdmin = (request, h) => {
  if (!isInRole(request.auth.credentials, 'admin')) {
    return h.redirect('/').takeover()
  }

  return h.continue
}

module.exports = [{
  method: 'GET',
  path: '/admin/delete-manager',
  options: {
    pre: [requireAdmin],
    validate: {
      query: joi.object({
        managerId: joi.string().required()
      })
    },
    handler: async (request, h) => {
      await api.post('/admin/managers/delete', {
        managerId: request.query.managerId
      }, request.dl_token)

      return h.redirect('/admin/managers')
    }
  }
}]
