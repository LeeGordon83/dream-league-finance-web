const financeService = require('../../services/finance')

module.exports = [{
  method: 'GET',
  path: '/finance/winnings',
  config: {},
  handler: async (_request, h) => {
    const winnings = await financeService.getWinnings()
    return h.response(winnings).code(200)
  }
}]
