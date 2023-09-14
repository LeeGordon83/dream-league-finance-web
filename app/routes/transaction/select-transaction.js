module.exports = [
  {
    method: 'GET',
    path: '/transaction/select-transaction',
    config: {
    },
    handler: async (request, h) => {
      return h.view('transaction/select-transaction')
    }
  },
  {
    method: 'POST',
    path: '/transaction/select-transaction',
    config: {},
    handler: async (request, h) => {
      const redirectRoute = request.payload.transactionType

      // Check the value of redirectRoute and redirect accordingly
      switch (redirectRoute) {
        case 'adhoc':
          return h.redirect('/transaction/adhoc')
        case 'weekly':
          return h.redirect('/transaction/weekly')
        case 'fivers':
          return h.redirect('/transaction/fivers')
        case 'jackpot':
          return h.redirect('/transaction/jackpot')
        default:
          return h.redirect('/transaction/league-cup')
      }
    }
  }
]
