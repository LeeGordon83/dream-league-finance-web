const bcrypt = require('bcrypt')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const boom = require('@hapi/boom')

const config = require('../../config')
const Manager = require('../models/manager')

const SALT_ROUNDS = 10

const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

const readManagerEmail = (manager) => manager.email || manager.Email || ''
const readManagerName = (manager) => manager.managerName || manager.ManagerName || ''
const readPasswordHash = (manager) => manager.passwordHash || manager.PasswordHash || ''

const toSafeManager = (manager) => ({
  id: String(manager.managerId || manager.ManagerId || manager._id),
  managerName: readManagerName(manager),
  email: readManagerEmail(manager)
})

const findManagerByEmail = async (email) => {
  const normalized = normalizeEmail(email)

  return Manager.findOne({
    $or: [
      { email: normalized },
      { Email: normalized }
    ]
  })
}

const createToken = (manager) => {
  const secret = config.jwtConfig.secret || 'development-secret-change-me'
  const expiryInMinutes = Number(config.jwtConfig.expiryInMinutes) || 43800

  return jwt.sign({
    sub: String(manager.managerId || manager.ManagerId || manager._id),
    email: readManagerEmail(manager),
    managerName: readManagerName(manager)
  }, secret, {
    expiresIn: `${expiryInMinutes}m`
  })
}

const register = async ({ managerName, email, password }) => {
  const normalizedEmail = normalizeEmail(email)
  const existing = await findManagerByEmail(normalizedEmail)

  if (!existing) {
    throw boom.unauthorized('You are not registered as a dream league member')
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

  const manager = await Manager.updateOne({ _id: existing._id }, {
    $set: {
      managerName,
      passwordHash
    }
  })

  const updated = await findManagerByEmail(normalizedEmail)
  const token = createToken(updated)

  return {
    token,
    manager: toSafeManager(updated)
  }
}

const login = async ({ email, password }) => {
  const manager = await findManagerByEmail(email)

  if (!manager) {
    throw boom.unauthorized('Invalid email or password')
  }

  const passwordHash = readPasswordHash(manager)
  const passwordMatches = passwordHash && await bcrypt.compare(password, passwordHash)

  if (!passwordMatches) {
    throw boom.unauthorized('Invalid email or password')
  }

  return {
    token: createToken(manager),
    manager: toSafeManager(manager)
  }
}

const forgotPassword = async ({ email }) => {
  const manager = await findManagerByEmail(email)

  if (!manager) {
    return {
      message: 'If an account exists for that email, a reset link has been generated.'
    }
  }

  const resetToken = crypto.randomBytes(32).toString('hex')
  const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
  const resetPasswordExpiresAt = new Date(Date.now() + (60 * 60 * 1000))

  await Manager.updateOne({ _id: manager._id }, {
    $set: {
      resetPasswordToken: hashedResetToken,
      resetPasswordExpiresAt
    }
  })

  const response = {
    message: 'If an account exists for that email, a reset link has been generated.'
  }

  // Expose the token in development to unblock local testing until email delivery is wired.
  if (config.isDev) {
    response.resetToken = resetToken
  }

  return response
}

const resetPassword = async ({ token, password }) => {
  const hashedResetToken = crypto.createHash('sha256').update(token).digest('hex')

  const manager = await Manager.findOne({
    $or: [
      { resetPasswordToken: hashedResetToken },
      { ResetPasswordToken: hashedResetToken }
    ]
  })

  if (!manager) {
    throw boom.badRequest('Invalid reset token')
  }

  const expiresAt = manager.resetPasswordExpiresAt || manager.ResetPasswordExpiresAt
  if (!expiresAt || new Date(expiresAt).getTime() < Date.now()) {
    throw boom.badRequest('Reset token has expired')
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

  await Manager.updateOne({ _id: manager._id }, {
    $set: {
      passwordHash
    },
    $unset: {
      resetPasswordToken: 1,
      resetPasswordExpiresAt: 1,
      ResetPasswordToken: 1,
      ResetPasswordExpiresAt: 1
    }
  })

  return {
    message: 'Password has been reset successfully.'
  }
}

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword
}
