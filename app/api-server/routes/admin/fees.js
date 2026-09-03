const joi = require('joi')
const financeService = require('../../services/finance')
const { requireAdmin } = require('../../auth')

module.exports = [{
  method: 'GET',
  path: '/admin/fees',
  config: {
    auth: 'jwt',
    pre: [requireAdmin]
  },
  handler: async (_request, h) => {
    const fees = await financeService.getAdminFees()
    return h.response(fees).code(200)
  }
}, {
  method: 'POST',
  path: '/admin/fees/create',
  config: {
    auth: 'jwt',
    pre: [requireAdmin],
    validate: {
      payload: joi.object({
        type: joi.string().trim().required(),
        amount: joi.number().min(0).required()
      })
    }
  },
  handler: async (request, h) => {
    const created = await financeService.createAdminFee(request.payload)
    return h.response(created).code(201)
  }
}, {
  method: 'POST',
  path: '/admin/fees/update',
  config: {
    auth: 'jwt',
    pre: [requireAdmin],
    validate: {
      payload: joi.object({
        id: joi.string().required(),
        type: joi.string().trim().required(),
        amount: joi.number().min(0).required()
      })
    }
  },
  handler: async (request, h) => {
    const updated = await financeService.updateAdminFee(request.payload)

    if (!updated) {
      return h.response({ message: 'Fee not found' }).code(404)
    }

    return h.response(updated).code(200)
  }
}, {
  method: 'POST',
  path: '/admin/fees/delete',
  config: {
    auth: 'jwt',
    pre: [requireAdmin],
    validate: {
      payload: joi.object({
        id: joi.string().required()
      })
    }
  },
  handler: async (request, h) => {
    const deleted = await financeService.deleteAdminFee(request.payload.id)

    if (!deleted) {
      return h.response({ message: 'Fee not found' }).code(404)
    }

    return h.response(deleted).code(200)
  }
}]
