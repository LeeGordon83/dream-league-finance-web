const financeService = require('../../services/finance')

module.exports = [{
  method: 'GET',
  path: '/finance/game-weeks',
  config: {},
  handler: async (_request, h) => {
    const gameWeeks = await financeService.getGameWeeks()
    return h.response(gameWeeks).code(200)
  }
}]
