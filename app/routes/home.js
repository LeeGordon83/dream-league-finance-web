const api = require('../api')
const { isInRole } = require('../auth')

module.exports = [{
  method: 'GET',
  path: '/',
  config: {
  },
  handler: async (request, h) => {
    const snapshot = await api.get('/finance/league-snapshot', request.dl_token)

    let actionQueue = null
    if (isInRole(request.auth.credentials, 'admin')) {
      actionQueue = await api.get('/admin/action-queue', request.dl_token)
    }

    return h.view('home', {
      snapshot,
      actionQueue
    })
  }
}]
