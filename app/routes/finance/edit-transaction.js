const joi = require('joi')
const api = require('../../api')

const TRANSACTION_TYPES = [
  'Ad-Hoc',
  'Weekly',
  'Fiver',
  'Jackpot'
]

const formatDateInput = (value) => {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 10)
}

module.exports = [{
  method: 'GET',
  path: '/finance/edit-transaction',
  options: {
    validate: {
      query: joi.object({
        transactionId: joi.string().required()
      })
    },
    handler: async (request, h) => {
      const transaction = await api.get(`/finance/transaction/${request.query.transactionId}`, request.dl_token)

      return h.view('finance/edit-transaction', {
        transactionId: transaction.transactionId,
        managerName: transaction.managerName,
        value: transaction.value,
        transactionType: transaction.transactionType,
        transactionTypes: TRANSACTION_TYPES,
        date: formatDateInput(transaction.date),
        weekId: transaction.weekId,
        notes: transaction.notes
      })
    }
  }
}, {
  method: 'POST',
  path: '/finance/edit-transaction',
  options: {
    validate: {
      payload: joi.object({
        transactionId: joi.string().required(),
        value: joi.number().required(),
        transactionType: joi.string().valid(...TRANSACTION_TYPES).required(),
        date: joi.date().required(),
        weekId: joi.number().required(),
        notes: joi.string().allow('', null)
      }),
      failAction: async (request, h, error) => {
        return h.view('finance/edit-transaction', {
          ...request.payload,
          transactionTypes: TRANSACTION_TYPES,
          message: 'Please check the transaction details and try again.',
          error
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      await api.post('/finance/transaction/update', request.payload, request.dl_token)
      return h.redirect('/finance/all-transactions')
    }
  }
}]
