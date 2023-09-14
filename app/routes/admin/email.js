module.exports = [{
  method: 'GET',
  path: '/admin/email',
  config: {
  },
  handler: async (request, h) => {
    return h.view('admin/email')
  }
}]
