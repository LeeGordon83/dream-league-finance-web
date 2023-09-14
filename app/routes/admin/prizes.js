module.exports = [{
  method: 'GET',
  path: '/admin/prizes',
  config: {
  },
  handler: async (request, h) => {
    return h.view('admin/prizes')
  }
}]
