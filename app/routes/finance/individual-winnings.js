module.exports = [{
  method: 'GET',
  path: '/finance/individual-winnings',
  config: {
  },
  handler: async (request, h) => {
    return h.view('finance/individual-winnings')
  }
}]
