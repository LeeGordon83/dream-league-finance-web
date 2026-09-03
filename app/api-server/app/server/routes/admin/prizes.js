const financeService = require('../../services/finance')
const { requireAdmin } = require('../../auth')

module.exports = [{
  method: 'GET',
  path: '/admin/prizes',
  config: {
    auth: 'jwt',
    pre: [requireAdmin]
  },
  handler: async (_request, h) => {
    const prizes = await financeService.getAdminPrizes()
    return h.response(prizes).code(200)
  }
}]
