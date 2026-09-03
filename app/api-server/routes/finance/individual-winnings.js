const financeService = require('../../services/finance')

module.exports = [{
  method: 'GET',
  path: '/finance/individual-winnings',
  config: {},
  handler: async (_request, h) => {
    const individualWinnings = await financeService.getIndividualWinnings()
    return h.response(individualWinnings).code(200)
  }
}]
