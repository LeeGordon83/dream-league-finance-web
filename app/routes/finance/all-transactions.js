const api = require('../../api')

module.exports = [{
  method: 'GET',
  path: '/finance/all-transactions',
  handler: async (request, h) => {
    const allTransactions = await api.get('/finance/all-transactions', request.dl_token)
    return h.view('finance/all-transactions', { allTransactions })
  }
}]
