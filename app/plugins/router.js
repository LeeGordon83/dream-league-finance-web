const routes = [].concat(
  require('../routes/index'),
  require('../routes/public')
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server, _options) => {
      server.route(routes)
    }
  }
}
