const api = require('../../api')

module.exports = [{
  method: 'GET',
  path: '/finance/winnings',
  config: {
  },
  handler: async (request, h) => {
    const winnings = await api.get('/finance/winnings')
    return h.view('finance/winnings', { winnings })
  }
}]
