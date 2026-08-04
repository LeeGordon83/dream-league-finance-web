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
  path: '/admin/fees',
  config: {
    pre: [requireAdmin]
  },
  handler: async (request, h) => {
    const fees = await api.get('/admin/fees', request.dl_token)
    return h.view('admin/fees', { fees })
  }
}]
