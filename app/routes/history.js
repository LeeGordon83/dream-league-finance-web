module.exports = [{
  method: 'GET',
  path: '/history',
  config: {
  },
  handler: async (request, h) => {
    return h.view('history')
  }
}]
