const createServer = require('./server')
const connectDB = require('./api-server/db')
const pkg = require('../package.json')

const init = async () => {
  await connectDB()
  const server = await createServer()
  await server.start()
  console.log('Dream League Finance (%s) running on %s', pkg.version, `http://localhost:${server.info.port}`)
}

init().catch(err => {
  console.log(err)
  process.exit(1)
})
