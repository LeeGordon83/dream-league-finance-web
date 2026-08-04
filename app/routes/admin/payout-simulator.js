const joi = require('joi')
const api = require('../../api')

const scenarioSchema = joi.object({
  managerId: joi.string().required(),
  leaguePosition: joi.number().integer().min(1).required(),
  cupResult: joi.string().valid('none', 'win', 'runner-up').required(),
  leagueCupResult: joi.string().valid('none', 'win', 'runner-up').required(),
  winsJackpot: joi.boolean().truthy('on').falsy('off').falsy('').default(false)
})

const ordinal = (n) => {
  const value = Number(n)
  if (!Number.isFinite(value)) return ''

  const mod100 = value % 100
  if (mod100 >= 11 && mod100 <= 13) {
    return `${value}th`
  }

  switch (value % 10) {
    case 1: return `${value}st`
    case 2: return `${value}nd`
    case 3: return `${value}rd`
    default: return `${value}th`
  }
}

const toAmount = (value) => {
  const parsed = Number(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

const roundCurrency = (value) => Math.round((toAmount(value) * 100)) / 100

const monthFormatter = new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' })

const toDate = (value) => {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const hasWeekStarted = (week) => {
  if (!week) {
    return false
  }

  if (week.complete === 'checked') {
    return true
  }

  const start = toDate(week.start)
  if (!start) {
    return false
  }

  const now = new Date()
  const nowUtcDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  return start <= nowUtcDay
}

const getFeeAmount = (fees, type) => {
  const fee = (fees || []).find(item => String(item.type || '') === type)
  return fee ? toAmount(fee.amount) : 0
}

const calculateFeesOwedToDate = (fees, gameWeeks) => {
  const startedWeeks = (gameWeeks || []).filter(hasWeekStarted)
  const startedMonths = new Set(
    startedWeeks
      .map(week => toDate(week.start))
      .filter(Boolean)
      .map(date => monthFormatter.format(date))
  )

  const weeklyFee = getFeeAmount(fees, 'Weekly')
  const joiningFee = getFeeAmount(fees, 'Joining Fee')
  const cupFee = getFeeAmount(fees, 'Cup Entry')
  const leagueCupFee = getFeeAmount(fees, 'League Cup Entry')

  let owed = startedWeeks.length * weeklyFee

  if (startedWeeks.length > 0) {
    owed += joiningFee
  }

  if (startedMonths.has('September')) {
    owed += cupFee
  }

  if (startedMonths.has('January')) {
    owed += leagueCupFee
  }

  return roundCurrency(owed)
}

const buildViewModel = ({ base, values, result, error }) => {
  const managers = (base && Array.isArray(base.managers)) ? base.managers : []
  const maxLeaguePosition = Math.max(1, Number((base && base.maxLeaguePosition) || managers.length || 1))

  return {
    managers,
    maxLeaguePosition,
    positions: buildPositions(maxLeaguePosition),
    values: {
      managerId: String(values && values.managerId ? values.managerId : (managers[0] ? (managers[0].managerId || managers[0].id || '') : '')),
      leaguePosition: Number(values && values.leaguePosition ? values.leaguePosition : 1),
      cupResult: String(values && values.cupResult ? values.cupResult : 'none'),
      leagueCupResult: String(values && values.leagueCupResult ? values.leagueCupResult : 'none'),
      winsJackpot: Boolean(values && values.winsJackpot)
    },
    result: result || null,
    error: error || null
  }
}

const loadBaseData = async (token) => {
  const [paidInResult, prizesResult, snapshotResult, feesResult, gameWeeksResult] = await Promise.allSettled([
    api.get('/finance/paid-in', token),
    api.get('/finance/prizes', token),
    api.get('/finance/league-snapshot', token),
    api.get('/finance/fees', token),
    api.get('/finance/game-weeks', token)
  ])

  const paidIn = paidInResult.status === 'fulfilled' ? paidInResult.value : { managers: [] }
  const prizes = prizesResult.status === 'fulfilled' ? prizesResult.value : []
  const snapshot = snapshotResult.status === 'fulfilled' ? snapshotResult.value : { totals: { currentJackpot: 0 } }
  const fees = feesResult.status === 'fulfilled' ? feesResult.value : []
  const gameWeeks = gameWeeksResult.status === 'fulfilled' ? gameWeeksResult.value : []

  const sortedManagers = ((paidIn && paidIn.managers) || [])
    .slice()
    .sort((a, b) => String(a.managerName || '').localeCompare(String(b.managerName || '')))
    .map(manager => ({
      id: manager.managerId,
      managerId: manager.managerId,
      name: manager.managerName
    }))

  return {
    managers: sortedManagers,
    prizes: prizes || [],
    snapshot,
    fees,
    gameWeeks,
    maxLeaguePosition: Math.max(1, Number(sortedManagers.length || 1))
  }
}

const buildPositions = (maxLeaguePosition) => {
  const positions = []
  for (let i = 1; i <= maxLeaguePosition; i++) {
    positions.push(i)
  }
  return positions
}

const buildPrizeLookup = (prizes) => {
  return (prizes || []).reduce((map, prize) => {
    map[prize.type] = toAmount(prize.amount)
    return map
  }, {})
}

const readTransactionType = (transaction) => {
  if (!transaction) {
    return ''
  }

  if (typeof transaction.transactionType === 'string') {
    return transaction.transactionType
  }

  return transaction.transactionType && transaction.transactionType.type
    ? transaction.transactionType.type
    : ''
}

const sumByTypes = (transactions, allowedTypes) => {
  return roundCurrency((transactions || [])
    .filter(transaction => allowedTypes.has(readTransactionType(transaction)))
    .reduce((sum, transaction) => sum + toAmount(transaction.value), 0))
}

const calculateScenario = ({ selectedManager, transactions, prizeLookup, snapshot, fees, gameWeeks, payload }) => {
  const managerName = selectedManager ? selectedManager.name : 'Unknown manager'
  const leaguePrizeType = ordinal(payload.leaguePosition)

  const weeklyTotal = sumByTypes(transactions, new Set(['Weekly']))
  const fiversTotal = sumByTypes(transactions, new Set(['Fiver']))
  const jackpotTotal = sumByTypes(transactions, new Set(['Jackpot']))
  const paidIn = sumByTypes(transactions, new Set(['Ad-Hoc']))
  const feesOwedToDate = calculateFeesOwedToDate(fees, gameWeeks)
  const outstandingContributions = roundCurrency(Math.max(0, feesOwedToDate - paidIn))
  const winningsToDate = roundCurrency(weeklyTotal + fiversTotal + jackpotTotal)

  const leaguePrize = roundCurrency(prizeLookup[leaguePrizeType] || 0)
  const cupPrize = payload.cupResult === 'win'
    ? roundCurrency(prizeLookup['Cup Win'] || 0)
    : payload.cupResult === 'runner-up'
      ? roundCurrency(prizeLookup['Cup Runner Up'] || 0)
      : 0

  const leagueCupPrize = payload.leagueCupResult === 'win'
    ? roundCurrency(prizeLookup['League Cup Win'] || 0)
    : payload.leagueCupResult === 'runner-up'
      ? roundCurrency(prizeLookup['League Cup Runner Up'] || 0)
      : 0

  const jackpotPrize = payload.winsJackpot
    ? roundCurrency(snapshot && snapshot.totals ? snapshot.totals.currentJackpot : 0)
    : 0

  const scenarioPayout = roundCurrency(leaguePrize + cupPrize + leagueCupPrize + jackpotPrize)
  const projectedTotalWinnings = roundCurrency(winningsToDate + scenarioPayout)
  const projectedNetPosition = roundCurrency(projectedTotalWinnings - feesOwedToDate)

  return {
    managerName,
    selectedLeaguePosition: payload.leaguePosition,
    leaguePrizeType,
    toDate: {
      weeklyTotal,
      fiversTotal,
      jackpotTotal,
      paidIn,
      feesOwedToDate,
      outstandingContributions,
      netToDate: roundCurrency(winningsToDate - feesOwedToDate),
      winningsToDate
    },
    scenario: {
      leaguePrize,
      cupPrize,
      leagueCupPrize,
      jackpotPrize,
      scenarioPayout
    },
    projected: {
      projectedTotalWinnings,
      projectedNetPosition
    }
  }
}

module.exports = [{
  method: 'GET',
  path: '/payout-simulator',
  config: {},
  handler: async (request, h) => {
    try {
      const base = await loadBaseData(request.dl_token)
      return h.view('admin/payout-simulator', buildViewModel({
        base,
        values: {
          managerId: base.managers[0] ? (base.managers[0].managerId || base.managers[0].id) : '',
          leaguePosition: 1,
          cupResult: 'none',
          leagueCupResult: 'none',
          winsJackpot: false
        },
        result: null,
        error: null
      }))
    } catch (_error) {
      return h.view('admin/payout-simulator', buildViewModel({
        base: { managers: [], maxLeaguePosition: 1 },
        values: { leaguePosition: 1, cupResult: 'none', leagueCupResult: 'none', winsJackpot: false },
        result: null,
        error: { message: 'Unable to load simulator data right now. Please try again shortly.' }
      }))
    }
  }
}, {
  method: 'POST',
  path: '/payout-simulator',
  options: {
    validate: {
      payload: scenarioSchema,
      failAction: async (request, h, error) => {
        const base = await loadBaseData(request.dl_token)
        return h.view('admin/payout-simulator', buildViewModel({
          base,
          values: request.payload,
          result: null,
          error
        })).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const payload = {
        managerId: String(request.payload.managerId),
        leaguePosition: Number(request.payload.leaguePosition),
        cupResult: String(request.payload.cupResult),
        leagueCupResult: String(request.payload.leagueCupResult),
        winsJackpot: Boolean(request.payload.winsJackpot)
      }

      try {
        const base = await loadBaseData(request.dl_token)
        const selectedManager = base.managers.find(manager => String(manager.managerId || manager.id) === payload.managerId)

        const allTransactionsResult = await api.get(`/finance/all-transactions?managerId=${encodeURIComponent(payload.managerId)}`, request.dl_token)
        const transactions = Array.isArray(allTransactionsResult && allTransactionsResult.transactions)
          ? allTransactionsResult.transactions
          : []

        const prizeLookup = buildPrizeLookup(base.prizes)

        const result = calculateScenario({
          selectedManager,
          transactions,
          prizeLookup,
          snapshot: base.snapshot,
          fees: base.fees,
          gameWeeks: base.gameWeeks,
          payload
        })

        return h.view('admin/payout-simulator', buildViewModel({
          base,
          values: payload,
          result,
          error: null
        }))
      } catch (_error) {
        const base = await loadBaseData(request.dl_token).catch(() => ({ managers: [], maxLeaguePosition: 1 }))
        return h.view('admin/payout-simulator', buildViewModel({
          base,
          values: payload,
          result: null,
          error: { message: 'Some finance data is missing right now, so we could not run that scenario. Please try again.' }
        }))
      }
    }
  }
}]
