const api = require('../../api')

module.exports = [{
  method: 'GET',
  path: '/admin/prizes',
  config: {
  },
  handler: async (request, h) => {
    const prizes = await api.get('/admin/prizes', request.dl_token)
    return h.view('admin/prizes', { prizes })
  }
}]
