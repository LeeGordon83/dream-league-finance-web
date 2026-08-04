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
  path: '/admin/season',
  config: {
    pre: [requireAdmin]
  },
  handler: async (request, h) => {
    const season = await api.get('/admin/season', request.dl_token)
    return h.view('admin/season', { season })
  }
}, {
  method: 'POST',
  path: '/admin/season',
  options: {
    pre: [requireAdmin],
    validate: {
      payload: joi.object({
        startDate: joi.date().required(),
        weekNum: joi.number().integer().min(1).max(50).required()
      }),
      failAction: async (request, h, error) => {
        return h.view('admin/season', {
          season: { weeks: [] },
          error,
          values: request.payload
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      try {
        await api.post('/admin/season', request.payload, request.dl_token)
        return h.redirect('/admin/season')
      } catch (error) {
        return h.view('admin/season', {
          season: { weeks: [] },
          values: request.payload,
          error: {
            message: error?.data?.payload?.error || error?.message || 'Unable to start season at this time.'
          }
        }).code(400)
      }
    }
  }
}]
