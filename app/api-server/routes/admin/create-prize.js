const joi = require('joi')
const financeService = require('../../services/finance')
const { requireAdmin } = require('../../auth')

module.exports = [{
  method: 'POST',
  path: '/admin/prizes/create',
  config: {
    auth: 'jwt',
    pre: [requireAdmin],
    validate: {
      payload: joi.object({
        type: joi.string().trim().required(),
        amount: joi.number().min(0).required(),
        league: joi.boolean().required()
      })
    }
  },
  handler: async (request, h) => {
    const createdPrize = await financeService.createAdminPrize(request.payload)
    return h.response(createdPrize).code(201)
  }
}]
