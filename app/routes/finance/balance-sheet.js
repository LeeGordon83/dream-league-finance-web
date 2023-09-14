module.exports = [{
  method: 'GET',
  path: '/finance/balance-sheet',
  config: {
  },
  handler: async (request, h) => {
    return h.view('finance/balance-sheet')
  }
}]
