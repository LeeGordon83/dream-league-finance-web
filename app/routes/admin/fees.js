module.exports = [{
  method: 'GET',
  path: '/admin/fees',
  config: {
  },
  handler: async (request, h) => {
    return h.view('admin/fees')
  }
}]
