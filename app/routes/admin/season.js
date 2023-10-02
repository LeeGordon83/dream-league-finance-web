const api = require('../../api')

module.exports = [{
  method: 'GET',
  path: '/admin/season',
  config: {
  },
  handler: async (request, h) => {
    const season = await api.get('/admin/season', request.dl_token)
    return h.view('admin/season', { season })
  }
}]
