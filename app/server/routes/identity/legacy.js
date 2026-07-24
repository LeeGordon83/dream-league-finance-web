const joi = require('joi')

const identityService = require('../../services/identity')

const inferManagerName = (email) => {
  const normalized = String(email || '').trim()
  const atIndex = normalized.indexOf('@')

  if (atIndex > 0) {
    return normalized.slice(0, atIndex)
  }

  return normalized || 'Manager'
}

module.exports = [{
  method: 'POST',
  path: '/login',
  config: {
    auth: false,
    validate: {
      payload: joi.object({
        email: joi.string().email().required(),
        password: joi.string().required()
      })
    }
  },
  handler: async (request, h) => {
    const result = await identityService.login(request.payload)
    return h.response(result).code(200)
  }
}, {
  method: 'POST',
  path: '/register',
  config: {
    auth: false,
    validate: {
      payload: joi.object({
        managerName: joi.string().trim().min(2).optional(),
        email: joi.string().email().required(),
        password: joi.string().min(8).required()
      })
    }
  },
  handler: async (request, h) => {
    const payload = {
      ...request.payload,
      managerName: request.payload.managerName || inferManagerName(request.payload.email)
    }

    const result = await identityService.register(payload)
    return h.response(result).code(201)
  }
}, {
  method: 'POST',
  path: '/forgot-password',
  config: {
    auth: false,
    validate: {
      payload: joi.object({
        email: joi.string().email().required()
      })
    }
  },
  handler: async (request, h) => {
    const result = await identityService.forgotPassword(request.payload)
    return h.response(result).code(200)
  }
}, {
  method: 'POST',
  path: '/reset-password',
  config: {
    auth: false,
    validate: {
      payload: joi.object({
        userId: joi.alternatives().try(joi.string(), joi.number()).optional(),
        token: joi.string().required(),
        password: joi.string().min(8).required()
      })
    }
  },
  handler: async (request, h) => {
    const result = await identityService.resetPassword({
      token: request.payload.token,
      password: request.payload.password
    })

    return h.response(result).code(200)
  }
}]
