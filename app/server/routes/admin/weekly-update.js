const joi = require('joi')
const config = require('../../../config')
const financeService = require('../../services/finance')
const { requireAdmin } = require('../../auth')

const sortByWeek = (entries) => {
  return (entries || [])
    .filter(entry => Number(entry && entry.weekId) > 0)
    .sort((a, b) => Number(a.weekId) - Number(b.weekId))
}

const toWeekId = (entry) => {
  const value = Number(
    entry && (
      entry.weekId ||
      entry.week ||
      entry.weekNo ||
      entry.gameWeek ||
      entry.gameweek ||
      entry.gw ||
      entry.round
    )
  )

  return Number.isFinite(value) && value > 0 ? value : null
}

const readNames = (entry) => {
  if (!entry) {
    return []
  }

  if (Array.isArray(entry.managerNames)) {
    return entry.managerNames.map(name => String(name || '').trim()).filter(Boolean)
  }

  if (Array.isArray(entry.winners)) {
    return entry.winners.map(name => String(name || '').trim()).filter(Boolean)
  }

  const single = entry.managerName || entry.winner || entry.name
  if (single) {
    return [String(single).trim()].filter(Boolean)
  }

  return []
}

const normalizeName = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')

const readWinnerType = (entry) => {
  const raw = String(
    (entry && (entry.type || entry.prizeType || entry.category || entry.transactionType || entry.transaction_type)) ||
    ''
  ).toLowerCase()

  if (!raw) {
    return 'weekly'
  }

  if (raw.includes('jackpot')) {
    return 'jackpot'
  }

  return 'weekly'
}

const groupWithNames = (entries) => {
  const map = {}
  const rows = entries || []

  rows.forEach(entry => {
    const weekId = toWeekId(entry)
    if (!weekId) {
      return
    }

    if (!map[weekId]) {
      map[weekId] = new Set()
    }

    readNames(entry).forEach(name => {
      map[weekId].add(name)
    })
  })

  return Object.keys(map)
    .map(Number)
    .sort((a, b) => a - b)
    .map(weekId => ({
      weekId,
      managerNames: Array.from(map[weekId])
    }))
}

const normalizeWinnersPayload = (payload) => {
  if (Array.isArray(payload)) {
    const weeklyRows = payload.filter(entry => readWinnerType(entry) === 'weekly')
    const jackpotRows = payload.filter(entry => readWinnerType(entry) === 'jackpot')

    return {
      weeklyWinnersByWeek: groupWithNames(weeklyRows),
      jackpotWinnersByWeek: groupWithNames(jackpotRows)
    }
  }

  if (payload && typeof payload === 'object') {
    const weekly = Array.isArray(payload.weeklyWinners) ? payload.weeklyWinners : []
    const jackpot = Array.isArray(payload.jackpotWinners) ? payload.jackpotWinners : []

    return {
      weeklyWinnersByWeek: groupWithNames(weekly),
      jackpotWinnersByWeek: groupWithNames(jackpot)
    }
  }

  return {
    weeklyWinnersByWeek: [],
    jackpotWinnersByWeek: []
  }
}

const fetchExternalWinners = async (url) => {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json'
    }
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Winners endpoint returned ${response.status}: ${body.slice(0, 200)}`)
  }

  const payload = await response.json()
  return normalizeWinnersPayload(payload)
}

module.exports = [{
  method: 'GET',
  path: '/admin/weekly-update',
  config: {
    auth: 'jwt',
    pre: [requireAdmin]
  },
  handler: async (_request, h) => {
    const snapshot = await financeService.getLeagueSnapshot()
    const currentWeek = Number(snapshot && snapshot.season && snapshot.season.currentWeek) || null

    let weeklyWinnersByWeek = []
    let jackpotWinnersByWeek = []
    let source = 'external'
    let warning = null

    if (!config.winnersApiUrl) {
      warning = 'WINNERS_API_URL is not configured.'
      source = 'none'
    } else {
      try {
        const external = await fetchExternalWinners(config.winnersApiUrl)
        weeklyWinnersByWeek = sortByWeek(external.weeklyWinnersByWeek)
        jackpotWinnersByWeek = sortByWeek(external.jackpotWinnersByWeek)
      } catch (error) {
        console.error('[winners-feed]', {
          url: config.winnersApiUrl,
          message: error && error.message,
          cause: error && error.cause && error.cause.message,
          code: error && (error.code || (error.cause && error.cause.code))
        })
        warning = 'Could not load winners feed from WINNERS_API_URL.'
        source = 'none'
      }
    }

    const latestWeekly = weeklyWinnersByWeek.length
      ? weeklyWinnersByWeek[weeklyWinnersByWeek.length - 1]
      : null

    const latestJackpot = latestWeekly
      ? jackpotWinnersByWeek.find(entry => Number(entry.weekId) === Number(latestWeekly.weekId))
      : null

    const alreadyRecorded = latestWeekly
      ? await financeService.hasWeeklyTransactionForWeek(Number(latestWeekly.weekId))
      : false

    return h.response({
      generatedAt: new Date().toISOString(),
      source,
      warning,
      currentWeek,
      latestRecordedWeek: latestWeekly ? Number(latestWeekly.weekId) : null,
      weeklyWinners: latestWeekly ? (latestWeekly.managerNames || []) : [],
      jackpotWinners: latestJackpot ? (latestJackpot.managerNames || []) : [],
      alreadyRecorded,
      hasWeeklyForCurrentWeek: currentWeek ? Boolean(latestWeekly && Number(latestWeekly.weekId) === currentWeek) : null
    }).code(200)
  }
}, {
  method: 'POST',
  path: '/admin/weekly-update',
  config: {
    auth: 'jwt',
    pre: [requireAdmin],
    validate: {
      payload: joi.object({
        weekId: joi.number().integer().min(1).required()
      })
    }
  },
  handler: async (request, h) => {
    const weekId = Number(request.payload.weekId)

    if (!config.winnersApiUrl) {
      return h.response({ error: 'WINNERS_API_URL is not configured.' }).code(400)
    }

    if (await financeService.hasWeeklyTransactionForWeek(weekId)) {
      return h.response({ error: `Weekly winnings for week ${weekId} have already been recorded.` }).code(409)
    }

    let external
    try {
      external = await fetchExternalWinners(config.winnersApiUrl)
    } catch (error) {
      console.error('[winners-feed]', { url: config.winnersApiUrl, message: error && error.message })
      return h.response({ error: 'Could not load winners feed from WINNERS_API_URL.' }).code(502)
    }

    const entry = external.weeklyWinnersByWeek.find(item => Number(item.weekId) === weekId)
    const winnerNames = entry ? (entry.managerNames || []) : []

    if (!winnerNames.length) {
      return h.response({ error: `No weekly winners found in the feed for week ${weekId}.` }).code(400)
    }

    const managers = await financeService.getAdhocManagers()
    const lookup = managers.reduce((map, manager) => {
      map[normalizeName(manager.name)] = manager.managerId
      return map
    }, {})

    const resolved = winnerNames.map(name => ({ name, managerId: lookup[normalizeName(name)] || null }))
    const unmatched = resolved.filter(item => !item.managerId).map(item => item.name)

    if (unmatched.length) {
      return h.response({
        error: `No matching manager for: ${unmatched.join(', ')}.`
      }).code(400)
    }

    const weeks = await financeService.getGameWeeks()
    const week = weeks.find(item => Number(item.weekId) === weekId)

    const result = await financeService.createWeeklyTransaction({
      managerSelect: resolved.map(item => item.managerId),
      weekId,
      transactionDate: (week && week.end) || new Date(),
      notes: `Weekly winnings for week ${weekId}`
    })

    return h.response({ ...result, weekId, winners: winnerNames }).code(201)
  }
}]
