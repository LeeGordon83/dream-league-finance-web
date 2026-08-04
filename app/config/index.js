const joi = require('joi')
const envs = ['development', 'test', 'production']

// Define config schema
const schema = joi.object().keys({
  port: joi.number().default(3001),
  env: joi.string().valid(...envs).default(envs[0]),
  jwtConfig: joi.object({
    secret: joi.string(),
    expiryInMinutes: joi.number().default(43800)
  }),
  webUrl: joi.string().uri().default('http://localhost:3000'),
  allowNonMemberRegistration: joi.boolean().default(false),
  winnersApiUrl: joi.string().uri().allow('', null).default('')
})

// Build config
const config = {
  port: process.env.PORT,
  env: process.env.NODE_ENV,
  jwtConfig: {
    secret: process.env.JWT_SECRET,
    expiryInMinutes: process.env.JWT_EXPIRY_IN_MINUTES
  },
  webUrl: process.env.WEB_URL,
  allowNonMemberRegistration: process.env.ALLOW_NON_MEMBER_REGISTRATION,
  winnersApiUrl: process.env.WINNERS_API_URL
}

// Validate config
const result = schema.validate(config, {
  abortEarly: false
})

if (result.error) {
  throw new Error(`The server config is invalid. ${result.error.message}`)
}

const value = {
  ...result.value
}
value.isDev = value.env === 'development'

module.exports = value
