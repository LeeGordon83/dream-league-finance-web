const Manager = require('../models/manager')
const Transaction = require('../models/transaction')
const Week = require('../models/week')
const Fee = require('../models/fee')
const Prize = require('../models/prize')
const mongoose = require('mongoose')

const monthFormatter = new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' })

const readWeeks = async () => {
  try {
    return await Week.find({}).lean()
  } catch (_error) {
    return []
  }
}

const readManagers = async () => {
  try {
    return await Manager.find({}).lean()
  } catch (_error) {
    return []
  }
}

const readTransactions = async () => {
  try {
    return await Transaction.find({}).lean()
  } catch (_error) {
    return []
  }
}

const readFees = async () => {
  try {
    return await Fee.find({}).lean()
  } catch (_error) {
    return []
  }
}

const readPrizes = async () => {
  try {
    return await Prize.find({}).lean()
  } catch (_error) {
    return []
  }
}

const toDate = (value) => {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const monthName = (dateValue) => {
  const date = toDate(dateValue)
  return date ? monthFormatter.format(date) : null
}

const managerName = (manager) => manager.managerName || manager.ManagerName || ''

const managerIsActive = (manager) => {
  if (typeof manager.active === 'boolean') {
    return manager.active
  }

  if (typeof manager.Active === 'boolean') {
    return manager.Active
  }

  return true
}

const normalizeId = (value) => {
  if (!value) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number') {
    return String(value)
  }

  if (value._id) {
    return String(value._id)
  }

  if (value.managerId) {
    return String(value.managerId)
  }

  if (value.ManagerId) {
    return String(value.ManagerId)
  }

  return String(value)
}

const managerIdsForTransaction = (transaction) => {
  return [
    transaction.managerId,
    transaction.ManagerId,
    transaction.manager,
    transaction.Manager,
    transaction.manager && transaction.manager.managerId,
    transaction.manager && transaction.manager.ManagerId,
    transaction.manager && transaction.manager._id,
    transaction.Manager && transaction.Manager.managerId,
    transaction.Manager && transaction.Manager.ManagerId,
    transaction.Manager && transaction.Manager._id
  ]
    .map(normalizeId)
    .filter(Boolean)
}

const transactionWeekNo = (transaction) => {
  const week = transaction.week || transaction.Week || null
  if (week) {
    return week.weekNo || week.WeekNo || 0
  }

  return transaction.weekNo || transaction.WeekNo || transaction.weekId || transaction.WeekId || 0
}

const transactionManagerName = (transaction, managerById) => {
  const directManager = transaction.manager || transaction.Manager || null
  if (directManager) {
    const name = directManager.managerName || directManager.ManagerName
    if (name) {
      return name
    }
  }

  const transactionManagerIds = managerIdsForTransaction(transaction)
  const mappedManager = transactionManagerIds
    .map(id => managerById[id])
    .find(Boolean)

  return mappedManager ? mappedManager.managerName : ''
}

const getMonthsFromWeeks = (weeks) => {
  if (!weeks.length) {
    return []
  }

  const withWeekNo = weeks
    .filter(week => week.weekNo || week.WeekNo)
    .sort((a, b) => (a.weekNo || a.WeekNo) - (b.weekNo || b.WeekNo))

  const startWeek = withWeekNo.find(week => (week.weekNo || week.WeekNo) === 1) || withWeekNo[0]
  const endWeek = withWeekNo[withWeekNo.length - 1]

  const startDate = toDate(startWeek.weekStartDate || startWeek.WeekStartDate)
  const endDate = toDate(endWeek.weekEndDate || endWeek.WeekEndDate)

  if (!startDate || !endDate) {
    return []
  }

  const months = []
  const cursor = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1))
  const endCursor = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1))

  while (cursor <= endCursor) {
    months.push({ monthName: monthFormatter.format(cursor) })
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }

  return months
}

const toTransactionValue = (transaction) => {
  const value = transaction.value ?? transaction.Value ?? 0
  const numeric = Number(value)
  return Number.isNaN(numeric) ? 0 : numeric
}

const toTransactionType = (transaction) => transaction.transactionType || transaction.TransactionType || ''

const toFeeType = (fee) => fee.feeType || fee.FeeType || ''

const toFeeAmount = (fee) => {
  const amount = fee.feeAmount ?? fee.FeeAmount ?? 0
  const numeric = Number(amount)
  return Number.isNaN(numeric) ? 0 : numeric
}

const toPrizeType = (prize) => prize.prizeType || prize.PrizeType || ''

const toPrizeAmount = (prize) => {
  const amount = prize.prizeAmount ?? prize.PrizeAmount ?? 0
  const numeric = Number(amount)
  return Number.isNaN(numeric) ? 0 : numeric
}

const isLeaguePrize = (prize) => Boolean(prize.leaguePrize ?? prize.LeaguePrize)

const isCupPrize = (prize) => Boolean(prize.cupPrize ?? prize.CupPrize)

const parseLeaguePosition = (type) => {
  const match = String(type || '').trim().match(/^(\d+)(st|nd|rd|th)$/i)
  if (!match) {
    return null
  }

  const value = Number(match[1])
  return Number.isInteger(value) ? value : null
}

const otherPrizePriority = {
  'Cup Win': 1,
  'Cup Runner Up': 2,
  'League Cup Win': 3,
  'League Cup Runner Up': 4
}

const comparePrizeOrder = (a, b) => {
  if (a.league && b.league) {
    const ap = parseLeaguePosition(a.type)
    const bp = parseLeaguePosition(b.type)

    if (ap !== null && bp !== null) {
      return ap - bp
    }

    if (ap !== null) return -1
    if (bp !== null) return 1
    return a.type.localeCompare(b.type)
  }

  if (!a.league && !b.league) {
    const ap = otherPrizePriority[a.type] || 999
    const bp = otherPrizePriority[b.type] || 999

    if (ap !== bp) {
      return ap - bp
    }

    return a.type.localeCompare(b.type)
  }

  return a.league ? -1 : 1
}

const getFeeAmount = (fees, feeType) => {
  const fee = fees.find(item => toFeeType(item) === feeType)
  return fee ? toFeeAmount(fee) : 0
}

const getPrizeAmount = (prizes, prizeType) => {
  const prize = prizes.find(item => toPrizeType(item) === prizeType)
  return prize ? toPrizeAmount(prize) : 0
}

const createGroupedTransactions = (transactions, months) => {
  return months.map(month => {
    const grouped = transactions.filter(transaction => monthName(transaction.transactionDate || transaction.TransactionDate) === month.monthName)

    let paidInSubtotal = 0
    let wonSubtotal = 0

    grouped.forEach(transaction => {
      const transactionType = toTransactionType(transaction)
      const value = toTransactionValue(transaction)

      if (transactionType === 'Ad-Hoc') {
        paidInSubtotal += value
      } else if (transactionType === 'Fiver' || transactionType === 'Weekly') {
        wonSubtotal += value
      }
    })

    return {
      monthName: month,
      paidInSubtotal,
      wonSubtotal
    }
  })
}

const getPaidIn = async () => {
  const [allManagers, transactions, weeks] = await Promise.all([
    readManagers(),
    readTransactions(),
    readWeeks()
  ])

  const months = getMonthsFromWeeks(weeks)

  const managers = allManagers
    .filter(managerIsActive)
    .sort((a, b) => managerName(a).localeCompare(managerName(b)))
    .map(manager => ({
      managerId: manager.managerId || manager.ManagerId || String(manager._id || ''),
      managerName: managerName(manager)
    }))

  const managersPaidIn = managers.map(manager => {
    const managerId = normalizeId(manager.managerId)
    const managerTransactions = transactions.filter(transaction => managerIdsForTransaction(transaction).includes(managerId))

    return {
      manager,
      managerName: manager.managerName,
      groupedTransactions: createGroupedTransactions(managerTransactions, months)
    }
  })

  return {
    managers,
    months,
    managersPaidIn
  }
}

const getBalance = async () => {
  const [fees, prizes, transactions, weeks, managers] = await Promise.all([
    readFees(),
    readPrizes(),
    readTransactions(),
    readWeeks(),
    readManagers()
  ])

  const numberOfWeeks = weeks.length
  const activeManagers = managers.filter(managerIsActive).length

  const weeklyFee = getFeeAmount(fees, 'Weekly')
  const joiningFee = getFeeAmount(fees, 'Joining Fee')
  const cupFee = getFeeAmount(fees, 'Cup Entry')
  const leagueCupFee = getFeeAmount(fees, 'League Cup Entry')

  const fiverPrize = getPrizeAmount(prizes, 'Five Fivers')
  const weeklyPrize = getPrizeAmount(prizes, 'Weekly Prize')

  let leagueCupExpected = 0
  prizes.forEach(prize => {
    if (isLeaguePrize(prize) || isCupPrize(prize)) {
      leagueCupExpected += toPrizeAmount(prize)
    }
  })

  const jackpotCarryOver = transactions
    .filter(transaction => toTransactionType(transaction) === 'Jackpot Carry Over')
    .reduce((sum, transaction) => sum + toTransactionValue(transaction), 0)

  let weeklyPrizeOut = 0
  let fiverOut = 0
  let jackpotOut = 0
  let leagueCupOutRaw = 0
  let currentTotalIn = 0

  transactions.forEach(transaction => {
    const type = toTransactionType(transaction)
    const value = toTransactionValue(transaction)

    if (type === 'Weekly') {
      weeklyPrizeOut += value
      return
    }

    if (type === 'Fiver') {
      fiverOut += value
      currentTotalIn += value
      return
    }

    if (type === 'Jackpot') {
      jackpotOut += value
      currentTotalIn += value
      return
    }

    if (type === 'Ad-Hoc') {
      currentTotalIn += value
      return
    }

    leagueCupOutRaw += value
  })

  const weeklyFees = numberOfWeeks * activeManagers * weeklyFee
  const joiningFees = activeManagers * joiningFee
  const cupFees = activeManagers * cupFee
  const leagueCupFees = activeManagers * leagueCupFee
  const fiverExpected = fiverPrize * 5 * 9
  const jackpotExpected = (numberOfWeeks * 2) + jackpotCarryOver
  const weeklyPrizeExpected = numberOfWeeks * weeklyPrize

  const expectedTotalIn = weeklyFees + joiningFees + cupFees + leagueCupFees + jackpotCarryOver
  const expectedTotalOut = fiverExpected + jackpotExpected + weeklyPrizeExpected + leagueCupExpected

  return {
    weeklyFees,
    joiningFees,
    cupFees,
    leagueCupFees,
    jackpotCarryOver,
    fiverExpected,
    fiverOut,
    jackpotExpected,
    jackpotOut,
    weeklyPrizeExpected,
    weeklyPrizeOut,
    leagueCupExpected,
    leagueCupOut: leagueCupOutRaw - jackpotCarryOver,
    expectedTotalIn,
    expectedTotalOut,
    currentTotalIn: currentTotalIn + jackpotCarryOver,
    currentTotalOut: leagueCupOutRaw + fiverOut + weeklyPrizeOut + jackpotOut
  }
}

const monthNumberByName = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12
}

const getCredit = async () => {
  const [fees, weeks, managers, transactions] = await Promise.all([
    readFees(),
    readWeeks(),
    readManagers(),
    readTransactions()
  ])

  const months = getMonthsFromWeeks(weeks)
  const weeklyFee = getFeeAmount(fees, 'Weekly')

  const owedByMonth = {}
  months.forEach(month => {
    owedByMonth[month.monthName] = 0
  })

  if (owedByMonth.August !== undefined) {
    owedByMonth.August += getFeeAmount(fees, 'Joining Fee')
  }

  if (owedByMonth.September !== undefined) {
    owedByMonth.September += getFeeAmount(fees, 'Cup Entry')
  }

  if (owedByMonth.January !== undefined) {
    owedByMonth.January += getFeeAmount(fees, 'League Cup Entry')
  }

  weeks.forEach(week => {
    const weekStartDate = toDate(week.weekStartDate || week.WeekStartDate)
    if (!weekStartDate) {
      return
    }

    const weekMonth = monthFormatter.format(weekStartDate)
    if (owedByMonth[weekMonth] !== undefined) {
      owedByMonth[weekMonth] += weeklyFee
    }
  })

  const groupedOwed = months.map(month => ({
    monthName: month,
    owedSubtotal: owedByMonth[month.monthName] || 0
  }))

  const totalOwed = groupedOwed.reduce((sum, month) => sum + month.owedSubtotal, 0)

  const managerCreditByMonth = managers
    .filter(managerIsActive)
    .sort((a, b) => managerName(a).localeCompare(managerName(b)))
    .map(manager => {
      const managerId = normalizeId(manager.managerId || manager.ManagerId || manager._id)
      const totalCredit = transactions
        .filter(transaction => managerIdsForTransaction(transaction).includes(managerId))
        .filter(transaction => toTransactionType(transaction) !== 'League or Cup')
        .reduce((sum, transaction) => sum + toTransactionValue(transaction), 0)

      let cumulativeOwed = 0
      const managerMonthlyCredit = months.map(month => {
        cumulativeOwed += owedByMonth[month.monthName] || 0
        return {
          monthName: month,
          monthNumber: monthNumberByName[month.monthName] || 0,
          monthCredit: totalCredit - cumulativeOwed
        }
      })

      return {
        manager: {
          id: managerId,
          name: managerName(manager)
        },
        managerCreditByMonth: managerMonthlyCredit,
        totalCredit: totalCredit - totalOwed
      }
    })

  return {
    months,
    managerCreditByMonth,
    owed: {
      groupedOwed,
      totalOwed
    }
  }
}

const getWinnings = async () => {
  const [transactions, weeks, allManagers] = await Promise.all([
    readTransactions(),
    readWeeks(),
    readManagers()
  ])

  const months = getMonthsFromWeeks(weeks)
  const managerById = allManagers
    .map(manager => ({
      id: normalizeId(manager.managerId || manager.ManagerId || manager._id),
      managerName: managerName(manager)
    }))
    .reduce((map, manager) => {
      map[manager.id] = manager
      return map
    }, {})

  const fiversByMonth = months.map(month => {
    const names = transactions
      .filter(transaction => toTransactionType(transaction) === 'Fiver')
      .filter(transaction => monthName(transaction.transactionDate || transaction.TransactionDate) === month.monthName)
      .map(transaction => transactionManagerName(transaction, managerById))
      .filter(Boolean)

    return {
      monthName: month.monthName,
      names
    }
  })

  const fiverTotalsByManager = {}
  transactions
    .filter(transaction => toTransactionType(transaction) === 'Fiver')
    .forEach(transaction => {
      const winnerName = transactionManagerName(transaction, managerById)
      if (!winnerName) {
        return
      }

      fiverTotalsByManager[winnerName] = (fiverTotalsByManager[winnerName] || 0) + toTransactionValue(transaction)
    })

  const fiversByManager = Object.keys(fiverTotalsByManager)
    .sort((a, b) => a.localeCompare(b))
    .map(name => ({
      managerName: name,
      count: fiverTotalsByManager[name]
    }))

  const groupWinnersByWeek = (type) => {
    const winnersByWeek = {}

    transactions
      .filter(transaction => toTransactionType(transaction) === type)
      .forEach(transaction => {
        const weekId = Number(transactionWeekNo(transaction))
        if (!weekId) {
          return
        }

        if (!winnersByWeek[weekId]) {
          winnersByWeek[weekId] = []
        }

        const winnerName = transactionManagerName(transaction, managerById)
        if (winnerName) {
          winnersByWeek[weekId].push(winnerName)
        }
      })

    return Object.keys(winnersByWeek)
      .map(Number)
      .sort((a, b) => a - b)
      .map(weekId => ({
        weekId,
        managerNames: winnersByWeek[weekId]
      }))
  }

  const weeklyWinners = groupWinnersByWeek('Weekly')
  const jackpotWinners = groupWinnersByWeek('Jackpot')

  const leagueCupTotalsByManager = {}
  transactions
    .filter(transaction => {
      const type = toTransactionType(transaction)
      return type === 'League or Cup' || type === 'LeagueCup'
    })
    .forEach(transaction => {
      const winnerName = transactionManagerName(transaction, managerById)
      if (!winnerName) {
        return
      }

      leagueCupTotalsByManager[winnerName] = (leagueCupTotalsByManager[winnerName] || 0) + toTransactionValue(transaction)
    })

  const leagueCupWinners = Object.keys(leagueCupTotalsByManager)
    .sort((a, b) => a.localeCompare(b))
    .map(name => ({
      managerName: name,
      count: leagueCupTotalsByManager[name]
    }))

  return {
    fiversByMonth,
    fiversByManager,
    weeklyWinners,
    jackpotWinners,
    leagueCupWinners
  }
}

const getIndividualWinnings = async () => {
  const [allManagers, transactions, fees, weeks] = await Promise.all([
    readManagers(),
    readTransactions(),
    readFees(),
    readWeeks()
  ])

  const totalWeeklyOwed = getFeeAmount(fees, 'Weekly') * weeks.length
  const fixedOwed = fees
    .filter(fee => toFeeType(fee) !== 'Weekly')
    .reduce((sum, fee) => sum + toFeeAmount(fee), 0)
  const totalOwed = totalWeeklyOwed + fixedOwed

  const managers = allManagers
    .filter(managerIsActive)
    .sort((a, b) => managerName(a).localeCompare(managerName(b)))

  return managers.map(manager => {
    const id = normalizeId(manager.managerId || manager.ManagerId || manager._id)
    const managerTransactions = transactions.filter(transaction => managerIdsForTransaction(transaction).includes(id))

    let fivers = 0
    let weekly = 0
    let jackpot = 0
    let league = 0
    let cup = 0
    let paidIn = 0

    managerTransactions.forEach(transaction => {
      const type = toTransactionType(transaction)
      const value = toTransactionValue(transaction)
      const notes = transaction.notes || transaction.Notes || ''

      if (type === 'Fiver') {
        fivers += value
        return
      }

      if (type === 'Weekly') {
        weekly += value
        return
      }

      if (type === 'Jackpot') {
        jackpot += value
        return
      }

      if (type === 'League or Cup' || type === 'LeagueCup') {
        if (notes === 'Cup Win' || notes === 'League Cup Win' || notes === 'Cup Runner Up' || notes === 'League Cup Runner Up') {
          cup += value
        } else {
          league += value
        }
        return
      }

      if (type === 'Ad-Hoc') {
        paidIn += value
      }
    })

    const leaguecup = league + cup
    const total = fivers + weekly + jackpot + leaguecup

    return {
      manager: managerName(manager),
      fivers,
      weekly,
      jackpot,
      leaguecup,
      total,
      payout: total + paidIn - totalOwed
    }
  })
}

const getGameWeeks = async () => {
  const weeks = await readWeeks()

  return weeks
    .map(week => ({
      weekId: week.weekNo || week.WeekNo || 0,
      start: week.weekStartDate || week.WeekStartDate || null,
      end: week.weekEndDate || week.WeekEndDate || null,
      complete: (week.weekCompleted ?? week.WeekCompleted) ? 'checked' : ''
    }))
    .sort((a, b) => a.weekId - b.weekId)
}

const getAllTransactions = async ({ managerId, month }) => {
  const [transactions, allManagers, weeks] = await Promise.all([
    readTransactions(),
    readManagers(),
    readWeeks()
  ])

  const managers = allManagers
    .filter(managerIsActive)
    .sort((a, b) => managerName(a).localeCompare(managerName(b)))
    .map(manager => ({
      managerId: normalizeId(manager.managerId || manager.ManagerId || manager._id),
      name: managerName(manager)
    }))

  const months = getMonthsFromWeeks(weeks).map(month => ({
    id: month.monthName,
    monthName: month.monthName
  }))

  let filtered = [...transactions]

  if (managerId) {
    const normalizedManagerId = normalizeId(managerId)
    filtered = filtered.filter(transaction => managerIdsForTransaction(transaction).includes(normalizedManagerId))
  }

  if (month) {
    filtered = filtered.filter(transaction => monthName(transaction.transactionDate || transaction.TransactionDate) === month)
  }

  const managerById = managers.reduce((map, manager) => {
    map[manager.managerId] = manager
    return map
  }, {})

  const mappedTransactions = filtered
    .map(transaction => {
      const ids = managerIdsForTransaction(transaction)
      const resolvedManager = ids.map(id => managerById[id]).find(Boolean)
      const directManagerName = transactionManagerName(transaction, managerById)

      return {
        transactionId: normalizeId(transaction.transactionId || transaction.TransactionId || transaction._id),
        manager: {
          name: resolvedManager ? resolvedManager.name : directManagerName
        },
        value: toTransactionValue(transaction),
        transactionType: {
          type: toTransactionType(transaction)
        },
        date: transaction.transactionDate || transaction.TransactionDate || null,
        weekId: Number(transactionWeekNo(transaction)) || 0,
        notes: transaction.notes || transaction.Notes || ''
      }
    })
    .sort((a, b) => {
      const ad = toDate(a.date)
      const bd = toDate(b.date)
      if (!ad && !bd) return 0
      if (!ad) return 1
      if (!bd) return -1
      return bd - ad
    })

  return {
    managers,
    months,
    transactions: mappedTransactions
  }
}

const getAdminFees = async () => {
  const fees = await readFees()

  return fees
    .map(fee => ({
      id: String(fee._id),
      type: toFeeType(fee),
      amount: toFeeAmount(fee)
    }))
    .filter(fee => fee.type)
    .sort((a, b) => a.type.localeCompare(b.type))
}

const createAdminFee = async ({ type, amount }) => {
  const created = await Fee.create({
    feeType: String(type || '').trim(),
    feeAmount: Number(amount || 0)
  })

  return {
    id: String(created._id),
    type: toFeeType(created),
    amount: toFeeAmount(created)
  }
}

const updateAdminFee = async ({ id, type, amount }) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null
  }

  const updated = await Fee.findByIdAndUpdate(
    id,
    { $set: { feeType: String(type || '').trim(), feeAmount: Number(amount || 0) } },
    { new: true }
  ).lean()

  if (!updated) {
    return null
  }

  return {
    id: String(updated._id),
    type: toFeeType(updated),
    amount: toFeeAmount(updated)
  }
}

const deleteAdminFee = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null
  }

  const deleted = await Fee.findByIdAndDelete(id).lean()

  if (!deleted) {
    return null
  }

  return { success: true }
}

const getAdminPrizes = async () => {
  const prizes = await readPrizes()

  return prizes
    .map(prize => ({
      type: toPrizeType(prize),
      amount: toPrizeAmount(prize),
      league: isLeaguePrize(prize)
    }))
    .filter(prize => prize.type)
    .sort(comparePrizeOrder)
}

const getAdminSeason = async () => {
  const [weeks, managers] = await Promise.all([
    readWeeks(),
    readManagers()
  ])

  const sortedWeeks = weeks
    .map(week => ({
      weekNo: week.weekNo || week.WeekNo || 0,
      start: week.weekStartDate || week.WeekStartDate || null,
      end: week.weekEndDate || week.WeekEndDate || null,
      complete: Boolean(week.weekCompleted ?? week.WeekCompleted)
    }))
    .filter(week => week.weekNo)
    .sort((a, b) => a.weekNo - b.weekNo)

  return {
    start: sortedWeeks.length ? sortedWeeks[0].start : null,
    weeks: sortedWeeks,
    managers: managers.filter(managerIsActive).length
  }
}

const isWeekComplete = (week) => {
  if (!week) {
    return false
  }

  if (week.complete) {
    return true
  }

  const end = toDate(week.end)
  if (!end) {
    return false
  }

  const now = new Date()
  const nowUtcDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  return end <= nowUtcDay
}

const hasWeekStarted = (week) => {
  if (!week) {
    return false
  }

  const start = toDate(week.start)
  if (!start) {
    return false
  }

  const now = new Date()
  const nowUtcDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  return start <= nowUtcDay
}

const toUtcDate = (value) => {
  if (!value) {
    return null
  }

  const input = String(value)
  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) {
    const year = Number(match[1])
    const month = Number(match[2]) - 1
    const day = Number(match[3])
    return new Date(Date.UTC(year, month, day))
  }

  const parsed = toDate(value)
  if (!parsed) {
    return null
  }

  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()))
}

const createAdminSeason = async ({ startDate, weekNum }) => {
  const existingWeeks = await readWeeks()
  const existingCount = existingWeeks.filter(week => Number(week.weekNo || week.WeekNo || 0) > 0).length
  if (existingCount > 0) {
    const error = new Error('Season already exists')
    error.code = 'SEASON_EXISTS'
    throw error
  }

  const parsedStart = toUtcDate(startDate)
  const totalWeeks = Number(weekNum)

  if (!parsedStart || !Number.isInteger(totalWeeks) || totalWeeks < 1) {
    const error = new Error('Invalid season inputs')
    error.code = 'INVALID_SEASON_INPUT'
    throw error
  }

  const weeks = []
  for (let i = 0; i < totalWeeks; i++) {
    const weekStartDate = new Date(parsedStart)
    weekStartDate.setUTCDate(parsedStart.getUTCDate() + (i * 7))

    const weekEndDate = new Date(weekStartDate)
    weekEndDate.setUTCDate(weekStartDate.getUTCDate() + 6)

    const weekNo = i + 1

    weeks.push({
      weekNo,
      WeekNo: weekNo,
      weekStartDate,
      WeekStartDate: weekStartDate,
      weekEndDate,
      WeekEndDate: weekEndDate
    })
  }

  await Week.insertMany(weeks)
  return getAdminSeason()
}

const getLeagueSnapshot = async () => {
  const [balance, credit, season, managers, transactions] = await Promise.all([
    getBalance(),
    getCredit(),
    getAdminSeason(),
    readManagers(),
    readTransactions()
  ])

  const activeManagers = managers.filter(managerIsActive)
  const managerById = activeManagers
    .map(manager => ({
      id: normalizeId(manager.managerId || manager.ManagerId || manager._id),
      managerName: managerName(manager)
    }))
    .reduce((map, manager) => {
      map[manager.id] = manager
      return map
    }, {})

  const currentWeek = season.weeks
    .filter(week => isWeekComplete(week) || hasWeekStarted(week))
    .reduce((max, week) => Math.max(max, Number(week.weekNo || 0)), 0)
  const totalWeeks = season.weeks.length
  const weeksRemaining = Math.max(0, totalWeeks - currentWeek)
  const jackpotAccruedWeeks = season.weeks.filter(week => isWeekComplete(week) || hasWeekStarted(week)).length

  const totalPaidIn = roundCurrency(balance.currentTotalIn)
  const totalPaidOut = roundCurrency(balance.currentTotalOut)
  const currentBalance = roundCurrency(totalPaidIn - totalPaidOut)
  const currentJackpot = roundCurrency(Math.max(
    0,
    (jackpotAccruedWeeks * 2) + Number(balance.jackpotCarryOver || 0) - Number(balance.jackpotOut || 0)
  ))
  const expectedBalance = roundCurrency(Number(balance.expectedTotalIn || 0) - Number(balance.expectedTotalOut || 0))
  const reconciliationGap = roundCurrency(currentBalance - expectedBalance)

  const managersBehind = credit.managerCreditByMonth
    .filter(item => Number(item.totalCredit || 0) < 0)
    .map(item => ({
      managerId: item.manager.id,
      managerName: item.manager.name,
      owed: roundCurrency(Math.abs(Number(item.totalCredit || 0)))
    }))
    .sort((a, b) => b.owed - a.owed)

  const outstandingExpectedContributions = roundCurrency(managersBehind.reduce((sum, item) => sum + item.owed, 0))

  const recentTransactions = transactions
    .map(transaction => {
      const date = transaction.transactionDate || transaction.TransactionDate || null
      return {
        id: normalizeId(transaction.transactionId || transaction.TransactionId || transaction._id),
        managerName: transactionManagerName(transaction, managerById),
        type: toTransactionType(transaction),
        direction: toTransactionType(transaction) === 'Ad-Hoc' ? 'in' : 'out',
        value: toTransactionValue(transaction),
        date,
        weekNo: Number(transactionWeekNo(transaction)) || 0
      }
    })
    .sort((a, b) => {
      const ad = toDate(a.date)
      const bd = toDate(b.date)
      if (!ad && !bd) return 0
      if (!ad) return 1
      if (!bd) return -1
      return bd - ad
    })
    .slice(0, 10)

  return {
    totals: {
      totalPaidIn,
      totalPaidOut,
      currentBalance,
      currentJackpot
    },
    season: {
      currentWeek,
      totalWeeks,
      weeksRemaining,
      activeManagers: activeManagers.length
    },
    health: {
      outstandingExpectedContributions,
      managersBehindCount: managersBehind.length,
      reconciliationGap,
      hasReconciliationGap: Math.abs(reconciliationGap) > 0.01
    },
    recentTransactions,
    managersBehind: managersBehind.slice(0, 5)
  }
}

const getAdminActionQueue = async () => {
  const [credit, season, transactions, managers] = await Promise.all([
    getCredit(),
    getAdminSeason(),
    readTransactions(),
    readManagers()
  ])

  const managerById = managers
    .map(manager => ({
      id: normalizeId(manager.managerId || manager.ManagerId || manager._id),
      managerName: managerName(manager)
    }))
    .reduce((map, manager) => {
      map[manager.id] = manager
      return map
    }, {})

  const behindManagers = credit.managerCreditByMonth
    .filter(item => Number(item.totalCredit || 0) < 0)
    .map(item => ({
      managerId: item.manager.id,
      managerName: item.manager.name,
      owed: roundCurrency(Math.abs(Number(item.totalCredit || 0)))
    }))
    .sort((a, b) => b.owed - a.owed)

  const weeks = season.weeks.map(week => Number(week.weekNo || 0)).filter(Boolean)
  const weeklyWeekNumbers = new Set(
    transactions
      .filter(transaction => toTransactionType(transaction) === 'Weekly')
      .map(transaction => Number(transactionWeekNo(transaction) || 0))
      .filter(Boolean)
  )
  const missingWeeklyWeeks = weeks.filter(weekNo => !weeklyWeekNumbers.has(weekNo))

  const unassignedTransactions = transactions
    .filter(transaction => !transactionManagerName(transaction, managerById))
    .map(transaction => ({
      transactionId: normalizeId(transaction.transactionId || transaction.TransactionId || transaction._id),
      type: toTransactionType(transaction),
      value: toTransactionValue(transaction),
      date: transaction.transactionDate || transaction.TransactionDate || null,
      weekNo: Number(transactionWeekNo(transaction)) || 0
    }))

  const actions = []

  if (behindManagers.length) {
    actions.push({
      key: 'manager-arrears',
      severity: 'high',
      title: 'Managers behind on contributions',
      count: behindManagers.length,
      description: `${behindManagers.length} manager(s) currently below expected contributions.`
    })
  }

  if (missingWeeklyWeeks.length) {
    actions.push({
      key: 'missing-weekly',
      severity: 'medium',
      title: 'Missing weekly prize entries',
      count: missingWeeklyWeeks.length,
      description: `${missingWeeklyWeeks.length} week(s) have no weekly payout transaction recorded.`
    })
  }

  if (unassignedTransactions.length) {
    actions.push({
      key: 'unassigned-transactions',
      severity: 'medium',
      title: 'Unassigned transactions found',
      count: unassignedTransactions.length,
      description: `${unassignedTransactions.length} transaction(s) are missing a manager link.`
    })
  }

  if (!actions.length) {
    actions.push({
      key: 'all-clear',
      severity: 'low',
      title: 'No immediate admin actions',
      count: 0,
      description: 'Everything looks up to date.'
    })
  }

  return {
    generatedAt: new Date().toISOString(),
    actions,
    behindManagers: behindManagers.slice(0, 10),
    missingWeeklyWeeks,
    unassignedTransactions: unassignedTransactions.slice(0, 10)
  }
}

const createAdminPrize = async ({ type, amount, league }) => {
  const created = await Prize.create({
    prizeType: String(type || '').trim(),
    prizeAmount: Number(amount || 0),
    leaguePrize: Boolean(league),
    cupPrize: false
  })

  return {
    type: toPrizeType(created),
    amount: toPrizeAmount(created),
    league: isLeaguePrize(created)
  }
}

const replaceAdminPrizesFromPlan = async (inputs) => {
  const plan = calculatePrizePlan(inputs)

  const leaguePrizeDocs = plan.competitions.leaguePrizes.map(prize => ({
    prizeType: ordinal(prize.position),
    prizeAmount: Number(prize.amount || 0),
    leaguePrize: true,
    cupPrize: false
  }))

  const cupPrizeDocs = [
    {
      prizeType: 'Cup Win',
      prizeAmount: Number(plan.competitions.cupPrizes.cupWin || 0),
      leaguePrize: false,
      cupPrize: true
    },
    {
      prizeType: 'League Cup Win',
      prizeAmount: Number(plan.competitions.cupPrizes.leagueCupWin || 0),
      leaguePrize: false,
      cupPrize: true
    },
    {
      prizeType: 'League Cup Runner Up',
      prizeAmount: Number(plan.competitions.cupPrizes.leagueCupRunnerUp || 0),
      leaguePrize: false,
      cupPrize: true
    },
    {
      prizeType: 'Cup Runner Up',
      prizeAmount: Number(plan.competitions.cupPrizes.cupRunnerUp || 0),
      leaguePrize: false,
      cupPrize: true
    }
  ]

  const fixedPrizeDocs = [
    {
      prizeType: 'Five Fivers',
      prizeAmount: FIXED_PRIZES.fiveFivers,
      leaguePrize: false,
      cupPrize: false
    },
    {
      prizeType: 'Weekly Prize',
      prizeAmount: FIXED_PRIZES.weeklyPrize,
      leaguePrize: false,
      cupPrize: false
    }
  ]

  const prizesToInsert = [...leaguePrizeDocs, ...cupPrizeDocs, ...fixedPrizeDocs]

  await Prize.deleteMany({})
  await Prize.insertMany(prizesToInsert)

  return {
    success: true,
    count: prizesToInsert.length,
    plan
  }
}

const getAdhocManagers = async () => {
  const managers = await readManagers()

  return managers
    .filter(managerIsActive)
    .sort((a, b) => managerName(a).localeCompare(managerName(b)))
    .map(manager => ({
      managerId: normalizeId(manager.managerId || manager.ManagerId || manager._id),
      name: managerName(manager)
    }))
    .filter(manager => manager.managerId && manager.name)
}

const createAdhocTransaction = async ({ amountPaid, managerSelect, notes }) => {
  const managerId = normalizeId(managerSelect)
  const managerQuery = {
    $or: [
      { managerId },
      { ManagerId: managerId }
    ]
  }

  if (mongoose.Types.ObjectId.isValid(managerId)) {
    managerQuery.$or.push({ _id: managerId })
  }

  const manager = await Manager.findOne(managerQuery).lean()

  const value = Number(amountPaid)
  const transaction = {
    transactionId: String(Date.now()),
    managerId,
    transactionType: 'Ad-Hoc',
    transactionDate: new Date(),
    value: Number.isNaN(value) ? 0 : value,
    notes: String(notes || '')
  }

  if (manager) {
    transaction.manager = {
      managerId,
      managerName: managerName(manager)
    }
  }

  const created = await Transaction.create(transaction)

  return {
    success: true,
    transactionId: normalizeId(created.transactionId || created.TransactionId || created._id)
  }
}

const findManagerById = async (managerIdRaw) => {
  const managerId = normalizeId(managerIdRaw)
  const managerQuery = {
    $or: [
      { managerId },
      { ManagerId: managerId }
    ]
  }

  if (mongoose.Types.ObjectId.isValid(managerId)) {
    managerQuery.$or.push({ _id: managerId })
  }

  const manager = await Manager.findOne(managerQuery).lean()
  return { managerId, manager }
}

const toManagerIds = (managerSelect) => {
  if (Array.isArray(managerSelect)) {
    return managerSelect.map(normalizeId).filter(Boolean)
  }

  const single = normalizeId(managerSelect)
  return single ? [single] : []
}

const createPayoutTransaction = async ({ managerSelect, amountWon, weekId, transactionDate, notes, transactionType }) => {
  const managerIds = toManagerIds(managerSelect)
  if (!managerIds.length) {
    throw new Error('At least one manager must be selected')
  }

  const value = Number(amountWon)
  const parsedWeekId = Number(weekId)
  const dateValue = transactionDate ? new Date(transactionDate) : new Date()
  const safeDate = Number.isNaN(dateValue.getTime()) ? new Date() : dateValue
  const safeValue = Number.isNaN(value) ? 0 : value
  const safeWeekId = Number.isNaN(parsedWeekId) ? 0 : parsedWeekId
  const safeNotes = String(notes || '')

  const createdAt = Date.now()
  const transactions = await Promise.all(managerIds.map(async (managerId, index) => {
    const { manager } = await findManagerById(managerId)

    const transaction = {
      transactionId: `${createdAt}-${index + 1}`,
      managerId,
      transactionType: String(transactionType || ''),
      transactionDate: safeDate,
      weekId: safeWeekId,
      value: safeValue,
      notes: safeNotes
    }

    if (manager) {
      transaction.manager = {
        managerId,
        managerName: managerName(manager)
      }
    }

    return transaction
  }))

  const created = await Transaction.insertMany(transactions)

  return {
    success: true,
    transactionIds: created.map(item => normalizeId(item.transactionId || item.TransactionId || item._id)),
    createdCount: created.length
  }
}

const splitAmountAcrossWinners = (totalAmount, winnerCount) => {
  const safeWinnerCount = Math.max(1, Number(winnerCount) || 1)
  const totalPennies = Math.round(Math.max(0, Number(totalAmount) || 0) * 100)
  const basePennies = Math.floor(totalPennies / safeWinnerCount)
  const remainderPennies = totalPennies % safeWinnerCount

  return Array.from({ length: safeWinnerCount }, (_item, index) => {
    const valuePennies = basePennies + (index < remainderPennies ? 1 : 0)
    return valuePennies / 100
  })
}

const createWeeklyTransaction = async ({ managerSelect, weekId, transactionDate, notes }) => {
  const managerIds = toManagerIds(managerSelect)
  if (!managerIds.length) {
    throw new Error('At least one manager must be selected')
  }

  const parsedWeekId = Number(weekId)
  const dateValue = transactionDate ? new Date(transactionDate) : new Date()
  const safeDate = Number.isNaN(dateValue.getTime()) ? new Date() : dateValue
  const safeWeekId = Number.isNaN(parsedWeekId) ? 0 : parsedWeekId
  const safeNotes = String(notes || '')
  const splitValues = splitAmountAcrossWinners(6, managerIds.length)
  const createdAt = Date.now()

  const transactions = await Promise.all(managerIds.map(async (managerId, index) => {
    const { manager } = await findManagerById(managerId)

    const transaction = {
      transactionId: `${createdAt}-${index + 1}`,
      managerId,
      transactionType: 'Weekly',
      transactionDate: safeDate,
      weekId: safeWeekId,
      value: splitValues[index],
      notes: safeNotes
    }

    if (manager) {
      transaction.manager = {
        managerId,
        managerName: managerName(manager)
      }
    }

    return transaction
  }))

  const created = await Transaction.insertMany(transactions)

  return {
    success: true,
    totalAmount: 6,
    transactionIds: created.map(item => normalizeId(item.transactionId || item.TransactionId || item._id)),
    createdCount: created.length
  }
}

const createFiverTransaction = async ({ managerSelect, amountWon, weekId, transactionDate, notes }) => {
  return createPayoutTransaction({
    managerSelect,
    amountWon,
    weekId,
    transactionDate,
    notes,
    transactionType: 'Fiver'
  })
}

const getJackpotAmountForWeek = async (weekIdRaw) => {
  const targetWeekId = Number(weekIdRaw)
  if (!Number.isInteger(targetWeekId) || targetWeekId < 1) {
    const error = new Error('Invalid week id')
    error.code = 'INVALID_WEEK'
    throw error
  }

  const [weeks, transactions] = await Promise.all([
    readWeeks(),
    readTransactions()
  ])

  const seasonWeeks = weeks
    .map(week => ({
      weekId: Number(week.weekNo || week.WeekNo || 0),
      start: week.weekStartDate || week.WeekStartDate || null,
      end: week.weekEndDate || week.WeekEndDate || null,
      complete: Boolean(week.weekCompleted ?? week.WeekCompleted)
    }))
    .filter(week => week.weekId > 0)
    .sort((a, b) => a.weekId - b.weekId)

  const hasTargetWeek = seasonWeeks.some(week => week.weekId === targetWeekId)
  if (!hasTargetWeek) {
    const error = new Error('Week not found')
    error.code = 'WEEK_NOT_FOUND'
    throw error
  }

  const jackpotAccruedWeeks = seasonWeeks
    .filter(week => week.weekId <= targetWeekId)
    .filter(week => isWeekComplete(week) || hasWeekStarted(week))
    .length

  const toWeekId = (transaction) => Number(transactionWeekNo(transaction) || 0)

  const jackpotCarryOver = transactions
    .filter(transaction => toTransactionType(transaction) === 'Jackpot Carry Over')
    .filter(transaction => {
      const transactionWeekId = toWeekId(transaction)
      return transactionWeekId === 0 || transactionWeekId <= targetWeekId
    })
    .reduce((sum, transaction) => sum + toTransactionValue(transaction), 0)

  const jackpotPaidOut = transactions
    .filter(transaction => toTransactionType(transaction) === 'Jackpot')
    .filter(transaction => {
      const transactionWeekId = toWeekId(transaction)
      return transactionWeekId === 0 || transactionWeekId <= targetWeekId
    })
    .reduce((sum, transaction) => sum + toTransactionValue(transaction), 0)

  const jackpotAmount = roundCurrency(Math.max(0, (jackpotAccruedWeeks * 2) + jackpotCarryOver - jackpotPaidOut))

  return {
    weekId: targetWeekId,
    amount: jackpotAmount
  }
}

const createJackpotTransaction = async ({ managerSelect, amountWon, weekId, transactionDate, notes }) => {
  const managerIds = toManagerIds(managerSelect)
  if (!managerIds.length) {
    throw new Error('At least one manager must be selected')
  }

  const totalAmount = Number(amountWon)
  const parsedWeekId = Number(weekId)
  const dateValue = transactionDate ? new Date(transactionDate) : new Date()
  const safeDate = Number.isNaN(dateValue.getTime()) ? new Date() : dateValue
  const safeTotalAmount = Number.isNaN(totalAmount) ? 0 : Math.max(0, roundCurrency(totalAmount))
  const safeWeekId = Number.isNaN(parsedWeekId) ? 0 : parsedWeekId
  const safeNotes = String(notes || '')

  const splitValues = splitAmountAcrossWinners(safeTotalAmount, managerIds.length)
  const createdAt = Date.now()

  const transactions = await Promise.all(managerIds.map(async (managerId, index) => {
    const { manager } = await findManagerById(managerId)

    const transaction = {
      transactionId: `${createdAt}-${index + 1}`,
      managerId,
      transactionType: 'Jackpot',
      transactionDate: safeDate,
      weekId: safeWeekId,
      value: splitValues[index],
      notes: safeNotes
    }

    if (manager) {
      transaction.manager = {
        managerId,
        managerName: managerName(manager)
      }
    }

    return transaction
  }))

  const created = await Transaction.insertMany(transactions)

  return {
    success: true,
    totalAmount: safeTotalAmount,
    transactionIds: created.map(item => normalizeId(item.transactionId || item.TransactionId || item._id)),
    createdCount: created.length
  }
}

const createLeagueCupTransaction = async ({ managerSelect, amountWon, weekId, transactionDate, notes }) => {
  return createPayoutTransaction({
    managerSelect,
    amountWon,
    weekId,
    transactionDate,
    notes,
    transactionType: 'League or Cup'
  })
}

const transactionQueryById = (transactionId) => {
  const query = {
    $or: [
      { transactionId },
      { TransactionId: transactionId }
    ]
  }

  if (mongoose.Types.ObjectId.isValid(transactionId)) {
    query.$or.push({ _id: transactionId })
  }

  return query
}

const getTransactionById = async (transactionId) => {
  const [transaction, managers] = await Promise.all([
    Transaction.findOne(transactionQueryById(transactionId)).lean(),
    readManagers()
  ])

  if (!transaction) {
    return null
  }

  const managerId = managerIdsForTransaction(transaction)[0] || ''
  const manager = managers.find(item => normalizeId(item.managerId || item.ManagerId || item._id) === managerId)

  return {
    transactionId: normalizeId(transaction.transactionId || transaction.TransactionId || transaction._id),
    managerId,
    managerName: manager ? managerName(manager) : transactionManagerName(transaction, {}),
    value: toTransactionValue(transaction),
    transactionType: toTransactionType(transaction),
    date: transaction.transactionDate || transaction.TransactionDate || null,
    weekId: Number(transactionWeekNo(transaction)) || 0,
    notes: transaction.notes || transaction.Notes || ''
  }
}

const updateTransaction = async ({ transactionId, value, transactionType, date, weekId, notes }) => {
  const numericValue = Number(value)
  const numericWeekId = Number(weekId)

  const updated = await Transaction.findOneAndUpdate(
    transactionQueryById(transactionId),
    {
      $set: {
        value: Number.isNaN(numericValue) ? 0 : numericValue,
        transactionType: String(transactionType || ''),
        transactionDate: date ? new Date(date) : null,
        weekId: Number.isNaN(numericWeekId) ? 0 : numericWeekId,
        notes: String(notes || '')
      }
    },
    { new: true }
  ).lean()

  if (!updated) {
    return null
  }

  return {
    success: true,
    transactionId: normalizeId(updated.transactionId || updated.TransactionId || updated._id)
  }
}

const deleteTransaction = async (transactionId) => {
  const deleted = await Transaction.findOneAndDelete(transactionQueryById(transactionId)).lean()

  if (!deleted) {
    return null
  }

  return {
    success: true
  }
}

const BASELINE_LEAGUE_PRIZES = [80, 70, 60, 50, 40, 32, 27, 20, 15, 10]
const BASELINE_CUP_PRIZES = {
  cupWin: 20,
  leagueCupWin: 20,
  leagueCupRunnerUp: 10,
  cupRunnerUp: 10
}
const CUP_PRIZE_KEYS = ['cupWin', 'leagueCupWin', 'leagueCupRunnerUp', 'cupRunnerUp']
const FIXED_PRIZES = {
  fiveFivers: 5,
  weeklyPrize: 6
}

const roundCurrency = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100

const sum = (values) => values.reduce((total, value) => total + value, 0)

const ordinal = (position) => {
  const value = Number(position) || 0
  const remainder100 = value % 100

  if (remainder100 >= 11 && remainder100 <= 13) {
    return `${value}th`
  }

  const remainder10 = value % 10
  if (remainder10 === 1) return `${value}st`
  if (remainder10 === 2) return `${value}nd`
  if (remainder10 === 3) return `${value}rd`
  return `${value}th`
}

const buildLeagueWeights = (managers) => {
  const safeManagers = Math.max(1, Number(managers) || 1)
  const weights = [...BASELINE_LEAGUE_PRIZES]

  if (safeManagers <= weights.length) {
    return weights.slice(0, safeManagers)
  }

  // Extend prize ladder with a gentle decay to keep lower places rewarded.
  while (weights.length < safeManagers) {
    const previous = weights[weights.length - 1]
    const next = Math.max(1, previous * 0.75)
    weights.push(next)
  }

  return weights
}

const scaleByWeightsExact = (weights, targetTotal) => {
  const safeTarget = Math.max(0, Number(targetTotal) || 0)
  const totalWeight = sum(weights)

  if (!totalWeight || !weights.length) {
    return []
  }

  return weights.map(weight => (weight / totalWeight) * safeTarget)
}

const roundToNearestPoundInBudget = (exactValues, targetTotal) => {
  const rounded = exactValues.map(value => Math.max(0, Math.round(value)))
  const target = Math.max(0, Math.round(Number(targetTotal) || 0))

  const current = rounded.reduce((total, value) => total + value, 0)
  let delta = target - current

  if (delta === 0) {
    return rounded
  }

  const penalty = (index, step) => {
    const exact = exactValues[index]
    const currentValue = rounded[index]
    const nextValue = currentValue + step

    if (nextValue < 0) {
      return Number.POSITIVE_INFINITY
    }

    const currentError = Math.abs(currentValue - exact)
    const nextError = Math.abs(nextValue - exact)
    return nextError - currentError
  }

  while (delta !== 0) {
    const step = delta > 0 ? 1 : -1
    let bestIndex = -1
    let bestPenalty = Number.POSITIVE_INFINITY

    for (let index = 0; index < rounded.length; index++) {
      const valuePenalty = penalty(index, step)
      if (valuePenalty < bestPenalty) {
        bestPenalty = valuePenalty
        bestIndex = index
      }
    }

    if (bestIndex === -1 || !Number.isFinite(bestPenalty)) {
      break
    }

    rounded[bestIndex] += step
    delta -= step
  }

  return rounded
}

const allocateCupPrizes = (cupPool) => {
  const safeCupPool = Math.max(0, Number(cupPool) || 0)
  const cupWeightTotal = sum(CUP_PRIZE_KEYS.map(key => BASELINE_CUP_PRIZES[key]))
  const minimumCupTotal = sum(CUP_PRIZE_KEYS.map(key => BASELINE_CUP_PRIZES[key]))

  if (!cupWeightTotal || safeCupPool <= 0) {
    return {
      cupWin: 0,
      leagueCupWin: 0,
      leagueCupRunnerUp: 0,
      cupRunnerUp: 0
    }
  }

  const exactCupValues = safeCupPool >= minimumCupTotal
    ? CUP_PRIZE_KEYS.map((key) => {
      const minimum = BASELINE_CUP_PRIZES[key]
      const extraPool = safeCupPool - minimumCupTotal
      const weightedExtra = (BASELINE_CUP_PRIZES[key] / cupWeightTotal) * extraPool
      return minimum + weightedExtra
    })
    : CUP_PRIZE_KEYS.map(key => (BASELINE_CUP_PRIZES[key] / cupWeightTotal) * safeCupPool)

  const roundedCupValues = roundToNearestPoundInBudget(exactCupValues, safeCupPool)

  return {
    cupWin: roundedCupValues[0],
    leagueCupWin: roundedCupValues[1],
    leagueCupRunnerUp: roundedCupValues[2],
    cupRunnerUp: roundedCupValues[3]
  }
}

const calculatePrizePlan = ({ managers, weeks, weeklyFee, leagueEntryFee, jackpotRemaining, cupEntryFee, leagueCupEntryFee }) => {
  const safeManagers = Math.max(1, Number(managers) || 1)
  const safeWeeks = Math.max(1, Number(weeks) || 1)
  const safeWeeklyFee = Math.max(0, Number(weeklyFee) || 0)
  const safeLeagueEntryFee = Math.max(0, Number(leagueEntryFee) || 5)
  const jackpotSeasonTotal = safeWeeks * 2
  const parsedJackpotRemaining = Number(jackpotRemaining)
  const safeJackpotRemaining = Math.max(
    0,
    Math.min(Number.isNaN(parsedJackpotRemaining) ? jackpotSeasonTotal : parsedJackpotRemaining, jackpotSeasonTotal)
  )
  const safeCupEntryFee = Math.max(0, Number(cupEntryFee) || 0)
  const safeLeagueCupEntryFee = Math.max(0, Number(leagueCupEntryFee) || 0)

  const weeklyIncome = safeWeeklyFee * safeManagers * safeWeeks
  const leagueEntryIncome = safeLeagueEntryFee * safeManagers
  const cupIncome = safeCupEntryFee * safeManagers
  const leagueCupIncome = safeLeagueCupEntryFee * safeManagers
  const prizePot = weeklyIncome + leagueEntryIncome + cupIncome + leagueCupIncome

  const fiversTotal = 225
  const jackpotAllocation = safeJackpotRemaining
  const jackpotPaidOut = Math.max(0, jackpotSeasonTotal - jackpotAllocation)
  const weeklyPrizesTotal = safeWeeks * 6

  const competitionsPool = Math.max(0, prizePot - fiversTotal - jackpotPaidOut - weeklyPrizesTotal)

  const baselineLeagueTotal = sum(BASELINE_LEAGUE_PRIZES)
  const baselineCupTotal = sum(Object.values(BASELINE_CUP_PRIZES))
  const baselineTotal = baselineLeagueTotal + baselineCupTotal

  const rawLeaguePool = baselineTotal
    ? roundCurrency((baselineLeagueTotal / baselineTotal) * competitionsPool)
    : 0

  // Cup prizes must be at minimum the total cup entry fees collected.
  // If the proportional cup pool falls short, take the deficit from the league pool.
  const minCupPool = roundCurrency(cupIncome + leagueCupIncome)
  const minCupPrizeGuaranteePool = sum(CUP_PRIZE_KEYS.map(key => BASELINE_CUP_PRIZES[key]))
  const rawCupPool = roundCurrency(competitionsPool - rawLeaguePool)
  const guaranteedCupPool = Math.max(rawCupPool, minCupPool, minCupPrizeGuaranteePool)
  const adjustedLeaguePool = Math.max(0, roundCurrency(competitionsPool - guaranteedCupPool))

  const leagueWeights = buildLeagueWeights(safeManagers)
  const scaledLeaguePrizes = scaleByWeightsExact(leagueWeights, adjustedLeaguePool)
  const roundedLeaguePrizes = roundToNearestPoundInBudget(scaledLeaguePrizes, adjustedLeaguePool)
  const leaguePool = sum(roundedLeaguePrizes)
  const cupPool = roundCurrency(competitionsPool - leaguePool)

  const leaguePrizes = roundedLeaguePrizes.map((amount, index) => ({
    position: index + 1,
    amount
  }))

  const cupPrizes = allocateCupPrizes(cupPool)

  const jackpotSharePerPosition = roundCurrency(jackpotAllocation / safeManagers)
  const exactJackpotNotWonPrizes = leaguePrizes.map((item, index) => {
    const shareWithRemainder = jackpotSharePerPosition + (index === 0 ? roundCurrency(jackpotAllocation - (jackpotSharePerPosition * safeManagers)) : 0)
    return item.amount + shareWithRemainder
  })
  const roundedJackpotNotWonPrizes = roundToNearestPoundInBudget(exactJackpotNotWonPrizes, leaguePool + jackpotAllocation)
  const leaguePrizesIfJackpotNotWon = roundedJackpotNotWonPrizes.map((amount, index) => ({
    position: index + 1,
    amount
  }))

  return {
    inputs: {
      managers: safeManagers,
      weeks: safeWeeks,
      weeklyFee: safeWeeklyFee,
      leagueEntryFee: safeLeagueEntryFee,
      jackpotRemaining: jackpotAllocation,
      cupEntryFee: safeCupEntryFee,
      leagueCupEntryFee: safeLeagueCupEntryFee
    },
    totals: {
      weeklyIncome: roundCurrency(weeklyIncome),
      leagueEntryIncome: roundCurrency(leagueEntryIncome),
      cupIncome: roundCurrency(cupIncome),
      leagueCupIncome: roundCurrency(leagueCupIncome),
      prizePot: roundCurrency(prizePot),
      incomePerManager: roundCurrency(prizePot / safeManagers),
      fiversTotal: roundCurrency(fiversTotal),
      jackpotSeasonTotal: roundCurrency(jackpotSeasonTotal),
      jackpotPaidOut: roundCurrency(jackpotPaidOut),
      jackpotRemaining: roundCurrency(jackpotAllocation),
      weeklyPrizesTotal: roundCurrency(weeklyPrizesTotal),
      competitionsPool: roundCurrency(competitionsPool),
      leaguePool: roundCurrency(leaguePool),
      cupPool: roundCurrency(cupPool)
    },
    competitions: {
      leaguePrizes,
      cupPrizes
    },
    jackpotScenarios: {
      jackpotWon: {
        leaguePrizes
      },
      jackpotNotWon: {
        jackpotSharePerPosition,
        leaguePrizes: leaguePrizesIfJackpotNotWon
      }
    }
  }
}

module.exports = {
  getPaidIn,
  getBalance,
  getCredit,
  getWinnings,
  getIndividualWinnings,
  getGameWeeks,
  getAllTransactions,
  getLeagueSnapshot,
  getAdminFees,
  createAdminFee,
  updateAdminFee,
  deleteAdminFee,
  getAdminPrizes,
  getAdminSeason,
  createAdminSeason,
  getAdminActionQueue,
  createAdminPrize,
  replaceAdminPrizesFromPlan,
  getAdhocManagers,
  createAdhocTransaction,
  createWeeklyTransaction,
  createFiverTransaction,
  getJackpotAmountForWeek,
  createJackpotTransaction,
  createLeagueCupTransaction,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  calculatePrizePlan
}
