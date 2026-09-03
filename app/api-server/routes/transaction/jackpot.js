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
  path: '/transaction/jackpot',
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
  path: '/transaction/jackpot',
  config: {
    auth: 'jwt',
    pre: [requireAdmin],
    validate: {
      payload: joi.object({
        managerSelect: joi.alternatives().try(
          joi.number(),
          joi.string(),
          joi.array().items(joi.alternatives().try(joi.number(), joi.string())).min(1)
        ).required(),
        weekId: joi.number().integer().min(1).optional().allow(null, ''),
        transactionDate: joi.date().required(),
        notes: joi.string().allow('', null)
      })
    }
  },
  handler: async (request, h) => {
    const selectedManagers = Array.isArray(request.payload.managerSelect)
      ? request.payload.managerSelect
      : [request.payload.managerSelect]
    const managerSelect = selectedManagers.map(value => String(value)).filter(Boolean)

    if (!managerSelect.length) {
      return h.response({ error: 'Please provide at least one winner.' }).code(400)
    }

    const weeks = await financeService.getGameWeeks()
    const selectedWeekId = request.payload.weekId ? Number(request.payload.weekId) : null
    const inferredWeekId = inferWeekIdFromDate(weeks, request.payload.transactionDate)
    const weekId = selectedWeekId || inferredWeekId

    if (!weekId) {
      return h.response({ error: 'Please select a week or provide a transaction date within a configured game week.' }).code(400)
    }

    let jackpot
    try {
      jackpot = await financeService.getJackpotAmountForWeek(weekId)
    } catch (error) {
      if (error.code === 'WEEK_NOT_FOUND') {
        return h.response({ error: 'Selected week was not found.' }).code(404)
      }

      if (error.code === 'INVALID_WEEK') {
        return h.response({ error: 'Selected week is invalid.' }).code(400)
      }

      throw error
    }

    const result = await financeService.createJackpotTransaction({
      managerSelect,
      amountWon: jackpot.amount,
      weekId,
      transactionDate: request.payload.transactionDate,
      notes: request.payload.notes
    })

    result.jackpotWeekId = weekId
    result.jackpotAmount = jackpot.amount
    return h.response(result).code(201)
  }
}]
