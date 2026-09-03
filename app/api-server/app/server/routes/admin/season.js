const financeService = require('../../services/finance')
const joi = require('joi')
const { requireAdmin } = require('../../auth')

module.exports = [{
  method: 'GET',
  path: '/admin/season',
  config: {
    auth: 'jwt',
    pre: [requireAdmin]
  },
  handler: async (_request, h) => {
    const season = await financeService.getAdminSeason()
    return h.response(season).code(200)
  }
}, {
  method: 'POST',
  path: '/admin/season',
  config: {
    auth: 'jwt',
    pre: [requireAdmin],
    validate: {
      payload: joi.object({
        startDate: joi.date().required(),
        weekNum: joi.number().integer().min(1).max(50).required()
      })
    }
  },
  handler: async (request, h) => {
    try {
      const season = await financeService.createAdminSeason(request.payload)
      return h.response(season).code(201)
    } catch (error) {
      if (error && error.code === 'SEASON_EXISTS') {
        return h.response({ error: 'Season already exists' }).code(409)
      }

      if (error && error.code === 'INVALID_SEASON_INPUT') {
        return h.response({ error: 'Invalid season inputs' }).code(400)
      }

      throw error
    }
  }
}]
