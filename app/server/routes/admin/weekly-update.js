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

    return h.response({
      generatedAt: new Date().toISOString(),
      source,
      warning,
      currentWeek,
      latestRecordedWeek: latestWeekly ? Number(latestWeekly.weekId) : null,
      weeklyWinners: latestWeekly ? (latestWeekly.managerNames || []) : [],
      jackpotWinners: latestJackpot ? (latestJackpot.managerNames || []) : [],
      hasWeeklyForCurrentWeek: currentWeek ? Boolean(latestWeekly && Number(latestWeekly.weekId) === currentWeek) : null
    }).code(200)
  }
}]
