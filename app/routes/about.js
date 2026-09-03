const api = require('../api')

module.exports = [{
  method: 'GET',
  path: '/about',
  config: {
  },
  handler: async (request, h) => {
    // This page is pinged externally to keep the free-tier services awake, so wake the API too.
    try {
      await api.get('/health')
    } catch (err) {
      request.log('error', { message: `API wake-up ping failed: ${err.message}` })
    }

    return h.view('about')
  }
}]
