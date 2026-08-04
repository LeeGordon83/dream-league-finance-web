const api = require('../../api')
const joi = require('joi')
const { isInRole } = require('../../auth')

const requireAdmin = (request, h) => {
  if (!isInRole(request.auth.credentials, 'admin')) {
    return h.redirect('/').takeover()
  }

  return h.continue
}

module.exports = [{
  method: 'GET',
  path: '/transaction/fivers',
  config: {
    pre: [requireAdmin]
  },
  handler: async (request, h) => {
    const data = await api.get('/transaction/fivers', request.dl_token)
    return h.view('transaction/fivers', {
      managers: data.managers || [],
      values: {
        transactionDate: new Date().toISOString().slice(0, 10)
      }
    })
  }
}, {
  method: 'POST',
  path: '/transaction/fivers',
  options: {
    pre: [requireAdmin],
    validate: {
      payload: joi.object({
        winner1: joi.alternatives().try(joi.number(), joi.string()).required(),
        winner2: joi.alternatives().try(joi.number(), joi.string()).required(),
        winner3: joi.alternatives().try(joi.number(), joi.string()).required(),
        winner4: joi.alternatives().try(joi.number(), joi.string()).required(),
        winner5: joi.alternatives().try(joi.number(), joi.string()).required(),
        transactionDate: joi.date().required(),
        notes: joi.string().allow('', null)
      }),
      failAction: async (request, h, error) => {
        const data = await api.get('/transaction/fivers', request.dl_token).catch(() => ({ managers: [] }))
        return h.view('transaction/fivers', {
          managers: data.managers || [],
          values: request.payload,
          error
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const winners = [
        request.payload.winner1,
        request.payload.winner2,
        request.payload.winner3,
        request.payload.winner4,
        request.payload.winner5
      ].map(value => String(value))

      if (new Set(winners).size !== 5) {
        const data = await api.get('/transaction/fivers', request.dl_token).catch(() => ({ managers: [] }))
        return h.view('transaction/fivers', {
          managers: data.managers || [],
          values: request.payload,
          error: { message: 'Please select five different winners.' }
        }).code(400)
      }

      try {
        await api.post('/transaction/fivers', {
          managerSelect: winners,
          transactionDate: request.payload.transactionDate,
          notes: request.payload.notes
        }, request.dl_token)
      } catch (error) {
        const data = await api.get('/transaction/fivers', request.dl_token).catch(() => ({ managers: [] }))
        return h.view('transaction/fivers', {
          managers: data.managers || [],
          values: request.payload,
          error: {
            message: error?.data?.payload?.error || error?.message || 'Unable to submit fivers at this time.'
          }
        }).code(400)
      }

      return h.redirect('/transaction/select-transaction')
    }
  }
}]
