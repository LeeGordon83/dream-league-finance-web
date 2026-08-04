const config = require('../../config')

const validateToken = (decoded, request, h) => {
  return {
    isValid: true,
    credentials: decoded
  }
}

module.exports = {
  plugin: {
    name: 'auth',
    register: (server, _options) => {
      server.auth.strategy('jwt', 'jwt', {
        key: config.jwtConfig.secret,
        validate: validateToken,
        verifyOptions: {
          algorithms: ['HS256']
        },
        urlKey: 'token',
        cookieKey: 'dl_token',
        headerScheme: 'Bearer'
      })
    }
  }
}
