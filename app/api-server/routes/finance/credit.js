const financeService = require('../../services/finance')

module.exports = [{
  method: 'GET',
  path: '/finance/credit',
  config: {},
  handler: async (_request, h) => {
    const credit = await financeService.getCredit()
    return h.response(credit).code(200)
  }
}]
