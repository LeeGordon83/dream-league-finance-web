const wreck = require('@hapi/wreck')
const config = require('../config')
const getConfiguration = require('./get-configuration')

// Free-tier services return these while spinning up from sleep.
const COLD_START_CODES = [429, 502, 503, 504]
// Render free instances take ~1 minute to spin up, so the backoff has to outlast that.
const MAX_ATTEMPTS = 5
const RETRY_DELAY_MS = 5000
const REQUEST_TIMEOUT_MS = 20000

const isColdStart = (err) => {
  const statusCode = err.output?.statusCode ?? err.data?.res?.statusCode
  return COLD_START_CODES.includes(statusCode) || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT'
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const get = async (url, token) => {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { payload } = await wreck.get(`${config.apiHost}${url}`, {
        timeout: REQUEST_TIMEOUT_MS,
        ...getConfiguration(token)
      })
      return payload
    } catch (err) {
      if (!isColdStart(err) || attempt === MAX_ATTEMPTS) {
        throw err
      }

      await delay(RETRY_DELAY_MS * attempt)
    }
  }
}

module.exports = get
