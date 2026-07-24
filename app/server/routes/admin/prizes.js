const financeService = require('../../services/finance')

module.exports = [{
  method: 'GET',
  path: '/admin/prizes',
  config: {},
  handler: async (_request, h) => {
    const prizes = await financeService.getAdminPrizes()
    return h.response(prizes).code(200)
  }
}]
