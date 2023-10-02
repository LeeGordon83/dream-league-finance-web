const api = require('../../api')

module.exports = [{
  method: 'GET',
  path: '/admin/managers',
  config: {
  },
  handler: async (request, h) => {
    const managers = await api.get('/admin/managers', request.dl_token)
    return h.view('admin/managers', { managers })
  }
}]
