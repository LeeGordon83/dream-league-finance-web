const { cookieOptions } = require('../config')

module.exports = {
  plugin: require('@hapi/crumb'),
  options: {
    cookieOptions,
    // API routes are only reached in-process, so they carry no crumb token.
    skip: (request) => request.path.startsWith('/api/')
  }
}
