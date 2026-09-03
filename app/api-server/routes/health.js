module.exports = [{
  method: 'GET',
  path: '/health',
  config: {
    auth: false
  },
  handler: (_request, h) => {
    return h.response({ status: 'ok', uptime: process.uptime() }).code(200)
  }
}]
