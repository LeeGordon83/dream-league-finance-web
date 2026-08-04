const financeService = require('../../services/finance')
const { requireAdmin } = require('../../auth')

module.exports = [{
  method: 'GET',
  path: '/admin/action-queue',
  config: {
    auth: 'jwt',
    pre: [requireAdmin]
  },
  handler: async (_request, h) => {
    const queue = await financeService.getAdminActionQueue()
    return h.response(queue).code(200)
  }
}]
