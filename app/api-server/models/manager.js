const mongoose = require('mongoose')

const managerSchema = new mongoose.Schema({
  managerId: String,
  ManagerId: String,
  managerName: String,
  ManagerName: String,
  active: Boolean,
  Active: Boolean
}, {
  strict: false
})

module.exports = mongoose.models.Manager || mongoose.model('Manager', managerSchema)
