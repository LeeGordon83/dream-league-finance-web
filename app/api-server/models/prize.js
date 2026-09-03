const mongoose = require('mongoose')

const prizeSchema = new mongoose.Schema({
  prizeType: String,
  PrizeType: String,
  prizeAmount: Number,
  PrizeAmount: Number,
  leaguePrize: Boolean,
  LeaguePrize: Boolean,
  cupPrize: Boolean,
  CupPrize: Boolean
}, {
  strict: false
})

module.exports = mongoose.models.Prize || mongoose.model('Prize', prizeSchema)
