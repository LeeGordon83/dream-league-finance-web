module.exports = [{
  method: 'GET',
  path: '/transaction/weekly',
  config: {
  },
  handler: async (request, h) => {
    return h.view('transaction/weekly')
  }
}]
