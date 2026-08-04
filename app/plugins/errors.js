module.exports = {
  plugin: {
    name: 'error-pages',
    register: (server, _options) => {
      server.ext('onPreResponse', (request, h) => {
        const response = request.response

        if (response.isBoom) {
          // An error was raised during
          // processing the request
          const statusCode = response.output.statusCode

          // if not authorised then request login
          if (statusCode === 401 || statusCode === 403) {
            return h.redirect('/login')
          }

          // In the event of 404
          // return the `404` view
          if (statusCode === 404) {
            return h.view('404').code(statusCode)
          }

          // Log the error
          request.log('error', {
            statusCode,
            message: response?.message,
            payloadMessage: response?.data?.payload?.message,
            stack: response?.data?.stack
          })

          // Emit diagnostics to container logs (request.log is not wired to stdout).
          console.error('[web-error]', {
            method: request.method,
            path: request.path,
            statusCode,
            message: response?.message,
            payloadMessage: response?.data?.payload?.message,
            data: response?.data,
            stack: response?.stack
          })

          // The return the `500` view
          return h.view('500').code(statusCode)
        }
        return h.continue
      })
    }
  }
}
