const { jwtConfig } = require('../config')
const { validate } = require('../auth')

module.exports = {
  plugin: {
    name: 'auth',
    register: (server, _options) => {
      // Keep legacy route handlers working by exposing the token on request.
      server.ext('onPostAuth', (request, h) => {
        request.dl_token = request.auth?.token || request.state?.dl_token || ''
        return h.continue
      })

      server.auth.strategy('jwt', 'jwt', {
        key: jwtConfig.secret,
        validate,
        cookieKey: 'dl_token',
        verifyOptions: {
          algorithms: ['HS256']
        }
      })
      server.auth.default({ strategy: 'jwt', mode: 'try' })
    }
  }
}
