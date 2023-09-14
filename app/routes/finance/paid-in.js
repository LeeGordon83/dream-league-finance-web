module.exports = [{
  method: 'GET',
  path: '/finance/paid-in',
  config: {
  },
  handler: async (request, h) => {
    return h.view('finance/paid-in')
  }
}]
