const api = require('../api')

module.exports = [{
  method: 'GET',
  path: '/prizes',
  config: {},
  handler: async (request, h) => {
    const [prizes, snapshot] = await Promise.all([
      api.get('/finance/prizes', request.dl_token),
      api.get('/finance/league-snapshot', request.dl_token).catch(() => null)
    ])

    const currentJackpot = Number(snapshot && snapshot.totals ? snapshot.totals.currentJackpot : 0) || 0
    return h.view('prizes', { prizes, currentJackpot })
  }
}]
