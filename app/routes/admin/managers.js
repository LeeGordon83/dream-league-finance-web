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
  path: '/admin/managers',
  config: {
    pre: [requireAdmin]
  },
  handler: async (request, h) => {
    const managers = await api.get('/admin/managers', request.dl_token)
    return h.view('admin/managers', { managers })
  }
}]
