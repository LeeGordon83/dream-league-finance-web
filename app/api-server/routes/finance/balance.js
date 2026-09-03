const financeService = require('../../services/finance')

module.exports = [{
  method: 'GET',
  path: '/finance/balance',
  config: {},
  handler: async (_request, h) => {
    const balance = await financeService.getBalance()
    return h.response(balance).code(200)
  }
}]
