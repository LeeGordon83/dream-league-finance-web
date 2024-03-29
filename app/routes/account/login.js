const joi = require('joi')
const config = require('../../config')
const api = require('../../api')

module.exports = [{
  method: 'GET',
  path: '/login',
  handler: (_request, h) => {
    return h.view('account/login')
  }
},
{
  method: 'POST',
  path: '/login',
  options: {
    validate: {
      payload: joi.object({
        email: joi.string().email().required(),
        password: joi.string().required()
      }),
      failAction: async (_request, h, _error) => {
        return h.view('account/login', {
          message: 'Email format incorrect'
        }).takeover()
      }
    },
    handler: async (request, h) => {
      try {
        const response = await api.post('/login', request.payload)
        return h.redirect('/')
          .header('Authorization', response.token)
          .state('dl_token', response.token, config.cookieOptionsIdentity)
      } catch {
        return h.view('account/login', {
          message: 'Invalid credentials'
        })
      }
    }
  }
}]
