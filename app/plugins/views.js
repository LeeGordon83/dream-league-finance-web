const nunjucks = require('nunjucks')
const path = require('path')
const config = require('../config')

module.exports = {
  plugin: require('@hapi/vision'),
  options: {
    engines: {
      html: {
        compile: (src, options) => {
          const template = nunjucks.compile(src, options.environment)

          return (context) => {
            return template.render(context)
          }
        },
        prepare: (options, next) => {
          options.compileOptions.environment = nunjucks.configure(path.join(options.relativeTo || process.cwd(), options.path), {
            autoescape: true,
            watch: config.isDev
          })
          return next()
        }
      }
    },
    path: '../views',
    isCached: !config.isDev,
    context: {
      assetPath: '/assets',
      serviceName: config.appName
    }
  }
}
