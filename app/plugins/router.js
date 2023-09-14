const routes = [].concat(
  require('../routes/home'),
  require('../routes/about'),
  require('../routes/history'),
  require('../routes/cookies'),
  require('../routes/public'),
  require('../routes/account/login'),
  require('../routes/account/register'),
  require('../routes/account/forgot-password'),
  require('../routes/account/reset-password'),
  require('../routes/account/logout'),
  require('../routes/transaction/select-transaction'),
  require('../routes/transaction/adhoc'),
  require('../routes/transaction/weekly'),
  require('../routes/transaction/fivers'),
  require('../routes/transaction/jackpot'),
  require('../routes/transaction/league-cup'),
  require('../routes/finance/all-transactions'),
  require('../routes/finance/paid-in'),
  require('../routes/finance/credit'),
  require('../routes/finance/balance-sheet'),
  require('../routes/finance/winnings'),
  require('../routes/finance/individual-winnings'),
  require('../routes/finance/game-weeks'),
  require('../routes/admin/email'),
  require('../routes/admin/fees'),
  require('../routes/admin/managers'),
  require('../routes/admin/prizes'),
  require('../routes/admin/season')
  // require('../routes/admin/add-history'),
  // require('../routes/admin/weekly-update')
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server, _options) => {
      server.route(routes)
    }
  }
}
