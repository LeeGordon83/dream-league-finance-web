const joi = require('joi')

module.exports = [{
  method: 'POST',
  path: '/validate',
  config: {
    auth: false,
    validate: {
      payload: joi.object({
        token: joi.object().required()
      })
    }
  },
  handler: async (request, h) => {
    const { token } = request.payload
    
    // If the token was successfully decoded by hapi-auth-jwt2,
    // we just need to verify it has the expected structure
    if (token && token.sub && token.email) {
      return h.response({
        isValid: true,
        credentials: token
      }).code(200)
    }
    
    return h.response({
      isValid: false
    }).code(401)
  }
}]
