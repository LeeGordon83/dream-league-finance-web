module.exports = [{
  method: 'GET',
  path: '/about',
  config: {
  },
  handler: async (request, h) => {
    return h.view('about')
  }
}]
