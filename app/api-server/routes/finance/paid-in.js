const financeService = require('../../services/finance')

module.exports = [{
  method: 'GET',
  path: '/finance/paid-in',
  config: {},
  handler: async (_request, h) => {
    const paidIn = await financeService.getPaidIn()
    return h.response(paidIn).code(200)
  }
}]
