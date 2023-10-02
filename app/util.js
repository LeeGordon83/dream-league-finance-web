const moment = require('moment-timezone')

function formatDate (value, format = 'DD/MM/YYYY') {
  return moment(value).tz('Europe/London').format(format)
}

function formatDateTime (value, format = 'DD/MM/YYYY h:mma') {
  return moment(value).tz('Europe/London').format(format)
}

module.exports = {
  formatDate,
  formatDateTime
}
