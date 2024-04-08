const api = require('../../api')

module.exports = [{
  method: 'GET',
  path: '/finance/individual-winnings',
  config: {
  },
  handler: async (request, h) => {
    const individualWinnings = await api.get('/finance/individual-winnings')
    return h.view('finance/individual-winnings', { individualWinnings })
  }
}]
