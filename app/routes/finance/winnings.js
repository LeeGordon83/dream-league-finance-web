module.exports = [{
  method: 'GET',
  path: '/finance/winnings',
  config: {
  },
  handler: async (request, h) => {
    return h.view('finance/winnings')
  }
}]
