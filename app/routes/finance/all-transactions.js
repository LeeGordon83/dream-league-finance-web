module.exports = [{
  method: 'GET',
  path: '/finance/all-transactions',
  config: {
  },
  handler: async (request, h) => {
    return h.view('finance/all-transactions')
  }
}]
