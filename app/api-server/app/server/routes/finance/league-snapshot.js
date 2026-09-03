const financeService = require('../../services/finance')

module.exports = [{
  method: 'GET',
  path: '/finance/league-snapshot',
  config: {},
  handler: async (_request, h) => {
    const snapshot = await financeService.getLeagueSnapshot()
    return h.response(snapshot).code(200)
  }
}]
