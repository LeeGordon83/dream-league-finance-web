const { isInRole } = require('../../auth')

const requireAdmin = (request, h) => {
  if (!isInRole(request.auth.credentials, 'admin')) {
    return h.redirect('/').takeover()
  }

  return h.continue
}

module.exports = [{
  method: 'GET',
  path: '/transaction/league-cup',
  config: {
    pre: [requireAdmin]
  },
  handler: async (request, h) => {
    return h.view('transaction/league-cup')
  }
}]
