const financeService = require('../../services/finance')

module.exports = [{
  method: 'GET',
  path: '/finance/all-transactions',
  config: {},
  handler: async (request, h) => {
    const { managerId, month } = request.query
    const allTransactions = await financeService.getAllTransactions({ managerId, month })
    return h.response(allTransactions).code(200)
  }
}]
