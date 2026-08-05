const joi = require('joi')
const api = require('../../api')
const { isInRole } = require('../../auth')

const requireAdmin = (request, h) => {
  if (!isInRole(request.auth.credentials, 'admin')) {
    return h.redirect('/').takeover()
  }

  return h.continue
}

module.exports = [{
  method: 'GET',
  path: '/admin/fees',
  config: {
    pre: [requireAdmin]
  },
  handler: async (request, h) => {
    const fees = await api.get('/admin/fees', request.dl_token)
    return h.view('admin/fees', { fees })
  }
}, {
  method: 'GET',
  path: '/admin/fees/create',
  options: {
    pre: [requireAdmin],
    handler: (_request, h) => h.view('admin/create-fee')
  }
}, {
  method: 'POST',
  path: '/admin/fees/create',
  options: {
    pre: [requireAdmin],
    validate: {
      payload: joi.object({
        type: joi.string().trim().required(),
        amount: joi.number().min(0).required()
      }),
      failAction: async (request, h, error) => {
        return h.view('admin/create-fee', {
          ...request.payload,
          message: 'Please check the fee details and try again.',
          error
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      await api.post('/admin/fees/create', {
        type: request.payload.type,
        amount: request.payload.amount
      }, request.dl_token)

      return h.redirect('/admin/fees')
    }
  }
}, {
  method: 'GET',
  path: '/admin/fees/edit',
  options: {
    pre: [requireAdmin],
    validate: {
      query: joi.object({
        feeId: joi.string().required()
      })
    },
    handler: async (request, h) => {
      const fees = await api.get('/admin/fees', request.dl_token)
      const fee = fees.find(f => f.id === request.query.feeId)

      if (!fee) {
        return h.redirect('/admin/fees')
      }

      return h.view('admin/edit-fee', { feeId: fee.id, type: fee.type, amount: fee.amount })
    }
  }
}, {
  method: 'POST',
  path: '/admin/fees/edit',
  options: {
    pre: [requireAdmin],
    validate: {
      payload: joi.object({
        feeId: joi.string().required(),
        type: joi.string().trim().required(),
        amount: joi.number().min(0).required()
      }),
      failAction: async (request, h, error) => {
        return h.view('admin/edit-fee', {
          feeId: request.payload.feeId,
          type: request.payload.type,
          amount: request.payload.amount,
          message: 'Please check the fee details and try again.',
          error
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      await api.post('/admin/fees/update', {
        id: request.payload.feeId,
        type: request.payload.type,
        amount: request.payload.amount
      }, request.dl_token)

      return h.redirect('/admin/fees')
    }
  }
}, {
  method: 'GET',
  path: '/admin/fees/delete',
  options: {
    pre: [requireAdmin],
    validate: {
      query: joi.object({
        feeId: joi.string().required()
      })
    },
    handler: async (request, h) => {
      await api.post('/admin/fees/delete', { id: request.query.feeId }, request.dl_token)
      return h.redirect('/admin/fees')
    }
  }
}]
