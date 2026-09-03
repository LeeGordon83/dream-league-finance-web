const joi = require('joi')
const financeService = require('../../services/finance')
const { requireAdmin } = require('../../auth')

const TRANSACTION_TYPES = [
  'Ad-Hoc',
  'Weekly',
  'Fiver',
  'Jackpot'
]

module.exports = [{
  method: 'GET',
  path: '/finance/transaction/{transactionId}',
  config: {
    auth: 'jwt',
    pre: [requireAdmin],
    validate: {
      params: joi.object({
        transactionId: joi.string().required()
      })
    }
  },
  handler: async (request, h) => {
    const transaction = await financeService.getTransactionById(request.params.transactionId)

    if (!transaction) {
      return h.response({ error: 'Transaction not found' }).code(404)
    }

    return h.response(transaction).code(200)
  }
}, {
  method: 'POST',
  path: '/finance/transaction/update',
  config: {
    auth: 'jwt',
    pre: [requireAdmin],
    validate: {
      payload: joi.object({
        transactionId: joi.string().required(),
        value: joi.number().required(),
        transactionType: joi.string().valid(...TRANSACTION_TYPES).required(),
        date: joi.date().required(),
        weekId: joi.number().required(),
        notes: joi.string().allow('', null)
      })
    }
  },
  handler: async (request, h) => {
    const updated = await financeService.updateTransaction(request.payload)

    if (!updated) {
      return h.response({ error: 'Transaction not found' }).code(404)
    }

    return h.response(updated).code(200)
  }
}, {
  method: 'POST',
  path: '/finance/transaction/delete',
  config: {
    auth: 'jwt',
    pre: [requireAdmin],
    validate: {
      payload: joi.object({
        transactionId: joi.string().required()
      })
    }
  },
  handler: async (request, h) => {
    const deleted = await financeService.deleteTransaction(request.payload.transactionId)

    if (!deleted) {
      return h.response({ error: 'Transaction not found' }).code(404)
    }

    return h.response(deleted).code(200)
  }
}]
