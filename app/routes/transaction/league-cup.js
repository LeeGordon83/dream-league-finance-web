module.exports = [{
  method: 'GET',
  path: '/transaction/league-cup',
  config: {
  },
  handler: async (request, h) => {
    return h.view('transaction/league-cup')
  }
}]
