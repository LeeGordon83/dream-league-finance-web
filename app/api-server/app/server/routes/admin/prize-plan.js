const joi = require('joi')
const financeService = require('../../services/finance')
const { requireAdmin } = require('../../auth')

module.exports = [{
  method: 'POST',
  path: '/admin/prize-plan',
  config: {
    auth: 'jwt',
    pre: [requireAdmin],
    validate: {
      payload: joi.object({
        managers: joi.number().integer().min(1).required(),
        weeks: joi.number().integer().min(1).required(),
        weeklyFee: joi.number().min(0).required(),
        leagueEntryFee: joi.number().min(0).required(),
        jackpotRemaining: joi.number().min(0).required(),
        cupEntryFee: joi.number().min(0).required(),
        leagueCupEntryFee: joi.number().min(0).required()
      })
    }
  },
  handler: async (request, h) => {
    const result = financeService.calculatePrizePlan(request.payload)
    return h.response(result).code(200)
  }
}]
