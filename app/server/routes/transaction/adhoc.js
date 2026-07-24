const joi = require('joi')
const financeService = require('../../services/finance')

module.exports = [{
  method: 'GET',
  path: '/transaction/adhoc',
  config: {},
  handler: async (_request, h) => {
    const managers = await financeService.getAdhocManagers()
    return h.response(managers).code(200)
  }
}, {
  method: 'POST',
  path: '/transaction/adhoc',
  config: {
    validate: {
      payload: joi.object({
        amountPaid: joi.number().required(),
        managerSelect: joi.alternatives().try(joi.number(), joi.string()).required(),
        notes: joi.string().allow('', null)
      })
    }
  },
  handler: async (request, h) => {
    const result = await financeService.createAdhocTransaction(request.payload)
    return h.response(result).code(201)
  }
}]
