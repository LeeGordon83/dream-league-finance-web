const createServer = require('./server')
const pkg = require('../package.json')

createServer()
  .then((server) => {
    server.start()
    const localUri = `http://localhost:${server.info.port}`
    console.log('Dream League Finance (%s) running on %s', pkg.version, localUri)
  })
  .catch(err => {
    console.log(err)
    process.exit(1)
  })
