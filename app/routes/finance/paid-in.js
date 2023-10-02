const api = require('../../api')

module.exports = [{
  method: 'GET',
  path: '/finance/paid-in',
  config: {
  },
  handler: async (request, h) => {
    const paidIn = await api.get('/finance/paid-in', request.dl_token)
    return h.view('finance/paid-in', { paidIn })
  }
}]
