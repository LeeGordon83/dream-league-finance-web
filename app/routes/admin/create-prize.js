const joi = require('joi')
const api = require('../../api')

module.exports = [{
  method: 'GET',
  path: '/admin/prizes/create',
  handler: (_request, h) => {
    return h.view('admin/create-prize')
  }
}, {
  method: 'POST',
  path: '/admin/prizes/create',
  options: {
    validate: {
      payload: joi.object({
        type: joi.string().trim().required(),
        amount: joi.number().min(0).required(),
        league: joi.any().optional()
      }),
      failAction: async (request, h, error) => {
        return h.view('admin/create-prize', {
          ...request.payload,
          message: 'Please check the prize details and try again.',
          error
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      await api.post('/admin/prizes/create', {
        type: request.payload.type,
        amount: request.payload.amount,
        league: Boolean(request.payload.league)
      }, request.dl_token)

      return h.redirect('/admin/prizes')
    }
  }
}]
