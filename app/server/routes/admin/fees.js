const financeService = require('../../services/finance')

module.exports = [{
  method: 'GET',
  path: '/admin/fees',
  config: {},
  handler: async (_request, h) => {
    const fees = await financeService.getAdminFees()
    return h.response(fees).code(200)
  }
}]
