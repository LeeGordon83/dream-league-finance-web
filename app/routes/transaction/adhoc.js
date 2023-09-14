module.exports = [{
  method: 'GET',
  path: '/transaction/adhoc',
  config: {
  },
  handler: async (request, h) => {
    return h.view('transaction/adhoc')
  }
}]
