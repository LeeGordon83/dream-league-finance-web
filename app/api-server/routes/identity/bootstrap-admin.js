const joi = require('joi')
const Manager = require('../../models/manager')
const bcrypt = require('bcrypt')

const SALT_ROUNDS = 10

module.exports = [{
  method: 'POST',
  path: '/identity/bootstrap-admin',
  config: {
    auth: false,
    validate: {
      payload: joi.object({
        email: joi.string().email().required(),
        password: joi.string().min(8).required(),
        managerName: joi.string().trim().required()
      })
    }
  },
  handler: async (request, h) => {
    const { email, password, managerName } = request.payload
    const normalizedEmail = String(email).trim().toLowerCase()
    
    // Check if any admin already exists
    const existingAdmin = await Manager.findOne({ isAdmin: true })
    if (existingAdmin) {
      return h.response({
        error: 'An admin user already exists'
      }).code(403)
    }
    
    // Check if manager exists
    const existing = await Manager.findOne({
      $or: [
        { email: normalizedEmail },
        { Email: normalizedEmail }
      ]
    })
    
    if (!existing) {
      return h.response({
        error: 'Manager not found. Please have an admin create your manager record first.'
      }).code(404)
    }
    
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    
    const updated = await Manager.findOneAndUpdate(
      { _id: existing._id },
      {
        $set: {
          managerName,
          passwordHash,
          isAdmin: true
        }
      },
      { new: true }
    ).lean()
    
    return h.response({
      success: true,
      message: 'Admin user initialized successfully',
      manager: {
        id: String(updated._id),
        email: updated.email || updated.Email,
        managerName: updated.managerName
      }
    }).code(200)
  }
}]
