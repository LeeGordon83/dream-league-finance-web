const joi = require('joi')
const financeService = require('../../services/finance')
const { requireAdmin } = require('../../auth')

module.exports = [{
  method: 'GET',
  path: '/transaction/league-cup',
  config: {
    auth: 'jwt',
    pre: [requireAdmin]
  },
  handler: async (_request, h) => {
    const [managers, weeks] = await Promise.all([
      financeService.getAdhocManagers(),
      financeService.getGameWeeks()
    ])

    return h.response({ managers, weeks }).code(200)
  }
}, {
  method: 'POST',
  path: '/transaction/league-cup',
  config: {
    auth: 'jwt',
    pre: [requireAdmin],
    validate: {
      payload: joi.object({
        managerSelect: joi.alternatives().try(joi.number(), joi.string()).required(),
        amountWon: joi.number().required(),
        weekId: joi.number().integer().min(1).required(),
        transactionDate: joi.date().required(),
        notes: joi.string().allow('', null)
      })
    }
  },
  handler: async (request, h) => {
    const result = await financeService.createLeagueCupTransaction(request.payload)
    return h.response(result).code(201)
  }
}]
