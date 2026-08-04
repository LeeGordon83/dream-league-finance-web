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
  path: '/transaction/weekly',
  config: {
    pre: [requireAdmin]
  },
  handler: async (request, h) => {
    const data = await api.get('/transaction/weekly', request.dl_token).catch(() => ({ managers: [], weeks: [] }))

    return h.view('transaction/weekly', {
      managers: data.managers || [],
      weeks: data.weeks || [],
      values: {
        transactionDate: new Date().toISOString().slice(0, 10)
      }
    })
  }
}, {
  method: 'POST',
  path: '/transaction/weekly',
  options: {
    pre: [requireAdmin],
    validate: {
      payload: joi.object({
        managerSelect: joi.alternatives().try(
          joi.number(),
          joi.string(),
          joi.array().items(joi.alternatives().try(joi.number(), joi.string())).min(1)
        ).required(),
        weekId: joi.number().integer().min(1).required(),
        transactionDate: joi.date().required(),
        notes: joi.string().allow('', null)
      }),
      failAction: async (request, h, error) => {
        const data = await api.get('/transaction/weekly', request.dl_token).catch(() => ({ managers: [], weeks: [] }))

        return h.view('transaction/weekly', {
          managers: data.managers || [],
          weeks: data.weeks || [],
          values: request.payload,
          error
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const managers = Array.isArray(request.payload.managerSelect)
        ? request.payload.managerSelect
        : [request.payload.managerSelect]

      const managerSelect = managers.map(value => String(value)).filter(Boolean)

      if (!managerSelect.length) {
        const data = await api.get('/transaction/weekly', request.dl_token).catch(() => ({ managers: [], weeks: [] }))
        return h.view('transaction/weekly', {
          managers: data.managers || [],
          weeks: data.weeks || [],
          values: request.payload,
          error: { message: 'Please select at least one winner.' }
        }).code(400)
      }

      await api.post('/transaction/weekly', {
        managerSelect,
        weekId: request.payload.weekId,
        transactionDate: request.payload.transactionDate,
        notes: request.payload.notes
      }, request.dl_token)

      return h.redirect('/transaction/select-transaction')
    }
  }
}]
