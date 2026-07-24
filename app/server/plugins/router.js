const routes = [].concat(
  require('../routes/identity/legacy'),
  require('../routes/finance/paid-in'),
  require('../routes/finance/balance'),
  require('../routes/finance/credit'),
  require('../routes/finance/winnings'),
  require('../routes/finance/individual-winnings'),
  require('../routes/finance/game-weeks'),
  require('../routes/finance/all-transactions'),
  require('../routes/finance/transaction'),
  require('../routes/admin/fees'),
  require('../routes/admin/prizes'),
  require('../routes/admin/create-prize'),
  require('../routes/admin/prize-plan'),
  require('../routes/admin/email'),
  require('../routes/admin/season'),
  require('../routes/transaction/adhoc'),
  require('../routes/identity/login'),
  require('../routes/identity/register'),
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
