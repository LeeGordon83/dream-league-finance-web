module.exports = [{
  method: 'GET',
  path: '/admin/managers',
  config: {
  },
  handler: async (request, h) => {
    return h.view('admin/managers')
  }
}]
