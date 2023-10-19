const api = require('../../api')

module.exports = [{
  method: 'GET',
  path: '/admin/fees',
  config: {
  },
  handler: async (request, h) => {
    const fees = await api.get('/admin/fees', request.dl_token)
    return h.view('admin/fees', { fees })
  }
}]
