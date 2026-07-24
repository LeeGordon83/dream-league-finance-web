const joi = require('joi')
const api = require('../../api')

module.exports = [{
  method: 'GET',
  path: '/finance/delete-transaction',
  options: {
    validate: {
      query: joi.object({
        transactionId: joi.string().required()
      })
    },
    handler: async (request, h) => {
      await api.post('/finance/transaction/delete', {
        transactionId: request.query.transactionId
      }, request.dl_token)

      return h.redirect('/finance/all-transactions')
    }
  }
}]
