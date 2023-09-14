module.exports = [{
  method: 'GET',
  path: '/finance/game-weeks',
  config: {
  },
  handler: async (request, h) => {
    return h.view('finance/game-weeks')
  }
}]
