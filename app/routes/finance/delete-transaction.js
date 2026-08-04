const joi = require('joi')
const api = require('../../api')
const { isInRole } = require('../../auth')

const requireAdmin = (request, h) => {
  if (!isInRole(request.auth.credentials, 'admin')) {
    return h.redirect('/').takeover()
  }

  return h.continue
}

module.exports = [{
  method: 'GET',
  path: '/finance/delete-transaction',
  options: {
    pre: [requireAdmin],
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
