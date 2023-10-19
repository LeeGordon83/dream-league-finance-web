const api = require('../../api')

module.exports = [{
  method: 'GET',
  path: '/finance/balance-sheet',
  config: {
  },
  handler: async (request, h) => {
    const balance = await api.get('/finance/balance', request.dl_token)
    return h.view('finance/balance-sheet', { balance })
  }
}]
