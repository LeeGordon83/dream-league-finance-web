module.exports = [{
  method: 'GET',
  path: '/transaction/jackpot',
  config: {
  },
  handler: async (request, h) => {
    return h.view('transaction/jackpot')
  }
}]
