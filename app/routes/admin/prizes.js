const api = require('../../api')
const { isInRole } = require('../../auth')

const requireAdmin = (request, h) => {
  if (!isInRole(request.auth.credentials, 'admin')) {
    return h.redirect('/').takeover()
  }

  return h.continue
}

module.exports = [{
  method: 'GET',
  path: '/admin/prizes',
  config: {
    pre: [requireAdmin]
  },
  handler: async (request, h) => {
    const prizes = await api.get('/admin/prizes', request.dl_token)
    return h.view('admin/prizes', { prizes })
  }
}]
