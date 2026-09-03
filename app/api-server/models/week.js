const mongoose = require('mongoose')

const weekSchema = new mongoose.Schema({
  weekNo: Number,
  WeekNo: Number,
  weekStartDate: Date,
  WeekStartDate: Date,
  weekEndDate: Date,
  WeekEndDate: Date
}, {
  strict: false
})

module.exports = mongoose.models.Week || mongoose.model('Week', weekSchema)
