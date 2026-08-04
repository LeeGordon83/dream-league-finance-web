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
  path: '/transaction/adhoc',
  config: {
    pre: [requireAdmin]
  },
  handler: async (request, h) => {
    const managers = await api.get('/transaction/adhoc', request.dl_token)
    return h.view('transaction/adhoc', { managers })
  }
}, {
  method: 'POST',
  path: '/transaction/adhoc',
  options: {
    pre: [requireAdmin],
    validate: {
      payload: joi.object({
        amountPaid: joi.number().required(),
        managerSelect: joi.number().required(),
        notes: joi.string().allow('', null)
      }),
      failAction: async (request, h, error) => {
        return h.view('transaction/adhoc', { error, adhoc: request.payload }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      await api.post('/transaction/adhoc', request.payload, request.state.dl_token)

      return h.view('transaction/select-transaction')
    }
  }
}]
