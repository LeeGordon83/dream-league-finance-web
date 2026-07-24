const joi = require('joi')
const config = require('../../config')
const api = require('../../api')

// Password validation requirements
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireNumbers: true,
  requireSpecialChars: true
}

const passwordSchema = joi.string()
  .min(PASSWORD_REQUIREMENTS.minLength)
  .pattern(/[A-Z]/, 'uppercase')
  .pattern(/[0-9]/, 'number')
  .pattern(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'special character')
  .required()
  .messages({
    'string.min': `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`,
    'string.pattern.name': 'Password must contain at least one {#name}',
    'any.required': 'Password is required'
  })

module.exports = [{
  method: 'GET',
  path: '/register',
  handler: (_request, h) => {
    return h.view('account/register', { passwordRequirements: PASSWORD_REQUIREMENTS })
  }
},
{
  method: 'POST',
  path: '/register',
  options: {
    validate: {
      payload: joi.object({
        email: joi.string().email().required(),
        password: passwordSchema
      }),
      failAction: async (_request, h, error) => {
        const message = error.details?.[0]?.message || 'Validation failed'
        return h.view('account/register', {
          message,
          email: _request.payload?.email,
          passwordRequirements: PASSWORD_REQUIREMENTS
        }).takeover()
      }
    },
    handler: async (request, h) => {
      try {
        const response = await api.post('/register', request.payload)
        if (!response) {
          return h.view('account/register', {
            message: 'Email already registered or not a dream league member',
            email: request.payload?.email,
            passwordRequirements: PASSWORD_REQUIREMENTS
          })
        }
        return h.redirect('/')
          .header('Authorization', response.token)
          .state('dl_token', response.token, config.cookieOptionsIdentity)
      } catch {
        return h.view('account/register', {
          message: 'Invalid credentials',
          email: request.payload?.email,
          passwordRequirements: PASSWORD_REQUIREMENTS
        })
      }
    }
  }
}]
