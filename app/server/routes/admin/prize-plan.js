const joi = require('joi')
const financeService = require('../../services/finance')

module.exports = [{
  method: 'POST',
  path: '/admin/prize-plan',
  config: {
    validate: {
      payload: joi.object({
        managers: joi.number().integer().min(1).required(),
        weeks: joi.number().integer().min(1).required(),
        weeklyFee: joi.number().min(0).required(),
        leagueEntryFee: joi.number().min(0).required(),
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
