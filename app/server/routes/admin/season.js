const financeService = require('../../services/finance')

module.exports = [{
  method: 'GET',
  path: '/admin/season',
  config: {},
  handler: async (_request, h) => {
    const season = await financeService.getAdminSeason()
    return h.response(season).code(200)
  }
}]
