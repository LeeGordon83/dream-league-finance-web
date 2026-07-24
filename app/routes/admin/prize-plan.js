const joi = require('joi')
const api = require('../../api')

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isNaN(parsed) ? fallback : parsed
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

  return {
    managers: Math.max(1, toNumber(season.managers, 1)),
    weeks: Math.max(1, toNumber((season.weeks || []).length, 1)),
    weeklyFee: getFeeByType(fees, 'Weekly'),
    leagueEntryFee: getFeeByType(fees, 'Joining Fee', 5),
    cupEntryFee: getFeeByType(fees, 'Cup Entry'),
    leagueCupEntryFee: getFeeByType(fees, 'League Cup Entry')
  }
}

module.exports = [{
  method: 'GET',
  path: '/admin/prize-plan',
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
    validate: {
      payload: joi.object({
        managers: joi.number().integer().min(1).required(),
        weeks: joi.number().integer().min(1).required(),
        weeklyFee: joi.number().min(0).required(),
        leagueEntryFee: joi.number().min(0).required(),
        cupEntryFee: joi.number().min(0).required(),
        leagueCupEntryFee: joi.number().min(0).required()
      }),
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
      const values = {
        managers: Number(request.payload.managers),
        weeks: Number(request.payload.weeks),
        weeklyFee: Number(request.payload.weeklyFee),
        leagueEntryFee: Number(request.payload.leagueEntryFee),
        cupEntryFee: Number(request.payload.cupEntryFee),
        leagueCupEntryFee: Number(request.payload.leagueCupEntryFee)
      }

      const result = await api.post('/admin/prize-plan', values, request.dl_token)

      return h.view('admin/prize-plan', {
        values,
        result,
        message: 'Prize plan calculated.'
      })
    }
  }
}]
