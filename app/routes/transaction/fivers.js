module.exports = [{
  method: 'GET',
  path: '/transaction/fivers',
  config: {
  },
  handler: async (request, h) => {
    return h.view('transaction/fivers')
  }
}]
