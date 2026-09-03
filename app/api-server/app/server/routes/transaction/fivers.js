const joi = require('joi')
const financeService = require('../../services/finance')
const { requireAdmin } = require('../../auth')

const startOfUtcDay = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

const inferWeekIdFromDate = (weeks, transactionDate) => {
  const target = startOfUtcDay(transactionDate)
  if (!target) {
    return null
  }

  const match = weeks.find(week => {
    const start = startOfUtcDay(week.start)
    const end = startOfUtcDay(week.end)

    if (!start || !end) {
      return false
    }

    return target >= start && target <= end
  })

  return match ? Number(match.weekId) : null
}

module.exports = [{
  method: 'GET',
  path: '/transaction/fivers',
  config: {
    auth: 'jwt',
    pre: [requireAdmin]
  },
  handler: async (_request, h) => {
    const [managers, weeks] = await Promise.all([
      financeService.getAdhocManagers(),
      financeService.getGameWeeks()
    ])

    return h.response({ managers, weeks }).code(200)
  }
}, {
  method: 'POST',
  path: '/transaction/fivers',
  config: {
    auth: 'jwt',
    pre: [requireAdmin],
    validate: {
      payload: joi.object({
        managerSelect: joi.array().items(joi.alternatives().try(joi.number(), joi.string())).length(5).required(),
        transactionDate: joi.date().required(),
        notes: joi.string().allow('', null)
      })
    }
  },
  handler: async (request, h) => {
    const winners = request.payload.managerSelect.map(value => String(value))

    if (new Set(winners).size !== 5) {
      return h.response({ error: 'Please provide five different winners.' }).code(400)
    }

    const weeks = await financeService.getGameWeeks()
    const weekId = inferWeekIdFromDate(weeks, request.payload.transactionDate)

    if (!weekId) {
      return h.response({ error: 'Transaction date does not fall into any configured game week.' }).code(400)
    }

    const result = await financeService.createFiverTransaction({
      managerSelect: winners,
      amountWon: 5,
      weekId,
      transactionDate: request.payload.transactionDate,
      notes: request.payload.notes
    })

    return h.response(result).code(201)
  }
}]
