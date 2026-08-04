const joi = require('joi')
const api = require('../../api')
const { isInRole } = require('../../auth')

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isNaN(parsed) ? fallback : parsed
}

const requireAdmin = (request, h) => {
  if (!isInRole(request.auth.credentials, 'admin')) {
    return h.redirect('/').takeover()
  }

  return h.continue
}

const getFeeByType = (fees, type, fallback = 0) => {
  const fee = (fees || []).find(item => item.type === type)
  return fee ? toNumber(fee.amount, fallback) : fallback
}

const getDefaultValues = async (token) => {
  const [season, fees] = await Promise.all([
    api.get('/admin/season', token),
    api.get('/admin/fees', token)
  ])

  const seasonWeeks = Number((season.weeks || []).length)
  const defaultWeeks = Number.isFinite(seasonWeeks) && seasonWeeks > 0 ? seasonWeeks : 40

  return {
    managers: Math.max(1, toNumber(season.managers, 1)),
    weeks: defaultWeeks,
    weeklyFee: getFeeByType(fees, 'Weekly'),
    leagueEntryFee: getFeeByType(fees, 'Joining Fee', 5),
    jackpotRemaining: Math.max(0, defaultWeeks * 2),
    cupEntryFee: getFeeByType(fees, 'Cup Entry'),
    leagueCupEntryFee: getFeeByType(fees, 'League Cup Entry')
  }
}

const payloadSchema = joi.object({
  managers: joi.number().integer().min(1).required(),
  weeks: joi.number().integer().min(1).required(),
  weeklyFee: joi.number().min(0).required(),
  leagueEntryFee: joi.number().min(0).required(),
  jackpotRemaining: joi.number().min(0).required(),
  cupEntryFee: joi.number().min(0).required(),
  leagueCupEntryFee: joi.number().min(0).required()
})

const mapValues = (payload) => ({
  managers: Number(payload.managers),
  weeks: Number(payload.weeks),
  weeklyFee: Number(payload.weeklyFee),
  leagueEntryFee: Number(payload.leagueEntryFee),
  jackpotRemaining: Number(payload.jackpotRemaining),
  cupEntryFee: Number(payload.cupEntryFee),
  leagueCupEntryFee: Number(payload.leagueCupEntryFee)
})

module.exports = [{
  method: 'GET',
  path: '/admin/prize-plan',
  config: {
    pre: [requireAdmin]
  },
  handler: async (request, h) => {
    const values = await getDefaultValues(request.dl_token)
    return h.view('admin/prize-plan', {
      values,
      result: null
    })
  }
}, {
  method: 'POST',
  path: '/admin/prize-plan',
  options: {
    pre: [requireAdmin],
    validate: {
      payload: payloadSchema,
      failAction: async (request, h, error) => {
        return h.view('admin/prize-plan', {
          values: request.payload,
          result: null,
          message: 'Please check the values and try again.',
          error
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const values = mapValues(request.payload)

      const result = await api.post('/admin/prize-plan', values, request.dl_token)

      return h.view('admin/prize-plan', {
        values,
        result,
        message: 'Prize plan calculated.'
      })
    }
  }
}, {
  method: 'POST',
  path: '/admin/prize-plan/apply',
  options: {
    pre: [requireAdmin],
    validate: {
      payload: payloadSchema,
      failAction: async (request, h, error) => {
        const values = mapValues(request.payload)
        const result = await api.post('/admin/prize-plan', values, request.dl_token)

        return h.view('admin/prize-plan', {
          values,
          result,
          message: 'Please check the values and try again.',
          error
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const values = mapValues(request.payload)
      const { plan } = await api.post('/admin/prize-plan/apply', values, request.dl_token)

      return h.view('admin/prize-plan', {
        values,
        result: plan,
        message: 'Prizes updated from prize plan. Existing prize entries were replaced.'
      })
    }
  }
}]
