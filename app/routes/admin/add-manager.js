const api = require('../../api')
const joi = require('joi')

module.exports = [{
  method: 'GET',
  path: '/admin/add-manager',
  config: {
  },
  handler: async (request, h) => {
    return h.view('admin/add-manager')
  }
}, {
  method: 'POST',
  path: '/admin/add-manager',
  options: {
    validate: {
      payload: joi.object({
        managerName: joi.string().required(),
        primaryEmail: joi.string().required(),
        secondaryEmail: joi.string().allow('', null)
      }),
      failAction: async (request, h, error) => {
        return h.view('admin/add-manager', { error, adhoc: request.payload }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      await api.post('/transaction/adhoc', request.payload, request.state.dl_token)

      return h.view('transaction/select-transaction')
    }
  }
}]
