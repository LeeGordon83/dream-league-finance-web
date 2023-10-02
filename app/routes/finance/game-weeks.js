const api = require('../../api')

module.exports = [{
  method: 'GET',
  path: '/finance/game-weeks',
  config: {
  },
  handler: async (request, h) => {
    const gameWeeks = await api.get('/finance/game-weeks', request.dl_token)
    return h.view('finance/game-weeks', { gameWeeks })
  }
}]
