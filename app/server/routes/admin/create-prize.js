const joi = require('joi')
const financeService = require('../../services/finance')

module.exports = [{
  method: 'POST',
  path: '/admin/prizes/create',
  config: {
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
