const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
  transactionId: String,
  TransactionId: String,
  managerId: mongoose.Schema.Types.Mixed,
  ManagerId: mongoose.Schema.Types.Mixed,
  manager: mongoose.Schema.Types.Mixed,
  Manager: mongoose.Schema.Types.Mixed,
  transactionType: String,
  TransactionType: String,
  transactionDate: Date,
  TransactionDate: Date,
  value: Number,
  Value: Number
}, {
  strict: false
})

module.exports = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema)
