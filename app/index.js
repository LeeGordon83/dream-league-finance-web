const createServer = require('./server')
const pkg = require('../package.json')

createServer()
  .then((server) => {
    server.start()
    console.log('Dream League Finance (%s) running on %s', pkg.version, server.info.uri)
  })
  .catch(err => {
    console.log(err)
    process.exit(1)
  })
