const joi = require('joi')
const emailService = require('../../services/email')

module.exports = [
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
        const { toEmail } = request.payload
        const info = await emailService.sendTestEmail(toEmail)
        return {
          success: true,
          message: 'Test email sent',
          messageId: info.messageId,
          response: info.response
        }
      } catch (err) {
        console.error('Failed to send test email:', err)
        return h.response({
          success: false,
          error: err.message
        }).code(500)
      }
    }
  }
]
