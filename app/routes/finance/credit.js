const api = require('../../api')

module.exports = [{
  method: 'GET',
  path: '/finance/credit',
  config: {
  },
  handler: async (request, h) => {
    const credit = await api.get('/finance/credit', request.dl_token)
    console.log(credit.owed.totalOwed)
    return h.view('finance/credit', { credit })
  }
}]
