const routes = [].concat(
  require('../routes/identity/legacy'),
  require('../routes/identity/validate'),
  require('../routes/finance/paid-in'),
  require('../routes/finance/balance'),
  require('../routes/finance/credit'),
  require('../routes/finance/fees'),
  require('../routes/finance/winnings'),
  require('../routes/finance/individual-winnings'),
  require('../routes/finance/game-weeks'),
  require('../routes/finance/prizes'),
  require('../routes/finance/league-snapshot'),
  require('../routes/finance/all-transactions'),
  require('../routes/finance/transaction'),
  require('../routes/admin/fees'),
  require('../routes/admin/prizes'),
  require('../routes/admin/create-prize'),
  require('../routes/admin/prize-plan'),
  require('../routes/admin/apply-prize-plan'),
  require('../routes/admin/action-queue'),
  require('../routes/admin/weekly-update'),
  require('../routes/admin/season'),
  require('../routes/transaction/adhoc'),
  require('../routes/transaction/weekly'),
  require('../routes/transaction/fivers'),
  require('../routes/transaction/jackpot'),
  require('../routes/transaction/league-cup'),
  require('../routes/identity/login'),
  require('../routes/identity/bootstrap-admin'),
  require('../routes/identity/forgot-password'),
  require('../routes/identity/reset-password'),
  require('../routes/managers')
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server, _options) => {
      server.route(routes)
    }
  }
}
