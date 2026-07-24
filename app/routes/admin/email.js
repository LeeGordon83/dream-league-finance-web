const joi = require('joi')
const api = require('../../api')

module.exports = [
  {
    method: 'GET',
    path: '/admin/email',
    config: {
    },
    handler: async (request, h) => {
      return h.view('admin/email')
    }
  },
  {
    method: 'POST',
    path: '/admin/email/test',
    config: {
      validate: {
        payload: joi.object({
          toEmail: joi.string().email().required()
        })
      }
    },
    handler: async (request, h) => {
      try {
        const result = await api.post('/admin/email/test', { toEmail: request.payload.toEmail }, request.dl_token)
        request.server.log(['success'], `Test email sent to ${request.payload.toEmail}`)
        return h.view('admin/email', {
          success: true,
          message: `Test email sent to ${request.payload.toEmail}`,
          result
        })
      } catch (err) {
        request.server.log(['error'], `Failed to send test email: ${err.message}`)
        return h.view('admin/email', {
          success: false,
          error: err.message
        })
      }
    }
  }
]
