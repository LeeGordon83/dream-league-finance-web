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
      type: toFeeType(fee),
      amount: toFeeAmount(fee)
    }))
    .filter(fee => fee.type)
    .sort((a, b) => a.type.localeCompare(b.type))
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
    .sort((a, b) => a.type.localeCompare(b.type))
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
      end: week.weekEndDate || week.WeekEndDate || null
    }))
    .filter(week => week.weekNo)
    .sort((a, b) => a.weekNo - b.weekNo)

  return {
    start: sortedWeeks.length ? sortedWeeks[0].start : null,
    weeks: sortedWeeks,
    managers: managers.filter(managerIsActive).length
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

const roundCurrency = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100

const sum = (values) => values.reduce((total, value) => total + value, 0)

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

const calculatePrizePlan = ({ managers, weeks, weeklyFee, leagueEntryFee, cupEntryFee, leagueCupEntryFee }) => {
  const safeManagers = Math.max(1, Number(managers) || 1)
  const safeWeeks = Math.max(1, Number(weeks) || 1)
  const safeWeeklyFee = Math.max(0, Number(weeklyFee) || 0)
  const safeLeagueEntryFee = Math.max(0, Number(leagueEntryFee) || 5)
  const safeCupEntryFee = Math.max(0, Number(cupEntryFee) || 0)
  const safeLeagueCupEntryFee = Math.max(0, Number(leagueCupEntryFee) || 0)

  const weeklyIncome = safeWeeklyFee * safeManagers * safeWeeks
  const leagueEntryIncome = safeLeagueEntryFee * safeManagers
  const cupIncome = safeCupEntryFee * safeManagers
  const leagueCupIncome = safeLeagueCupEntryFee * safeManagers
  const prizePot = weeklyIncome + leagueEntryIncome + cupIncome + leagueCupIncome

  const fiversTotal = 225
  const jackpotAllocation = safeWeeks * 2
  const weeklyPrizesTotal = safeWeeks * 6

  const competitionsPool = Math.max(0, prizePot - fiversTotal - jackpotAllocation - weeklyPrizesTotal)

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
      jackpotAllocation: roundCurrency(jackpotAllocation),
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
  getAdminFees,
  getAdminPrizes,
  getAdminSeason,
  createAdminPrize,
  getAdhocManagers,
  createAdhocTransaction,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  calculatePrizePlan
}
