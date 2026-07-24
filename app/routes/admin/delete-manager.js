const joi = require('joi')
const api = require('../../api')

module.exports = [{
  method: 'GET',
  path: '/admin/delete-manager',
  options: {
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
