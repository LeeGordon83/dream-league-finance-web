const mongoose = require('mongoose')

const feeSchema = new mongoose.Schema({
  feeType: String,
  FeeType: String,
  feeAmount: Number,
  FeeAmount: Number
}, {
  strict: false
})

module.exports = mongoose.models.Fee || mongoose.model('Fee', feeSchema)
