module.exports = [{
  method: 'GET',
  path: '/admin/season',
  config: {
  },
  handler: async (request, h) => {
    return h.view('admin/season')
  }
}]
