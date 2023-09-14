module.exports = [{
  method: 'GET',
  path: '/finance/credit',
  config: {
  },
  handler: async (request, h) => {
    return h.view('finance/credit')
  }
}]
