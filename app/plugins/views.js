const nunjucks = require('nunjucks')
const path = require('path')
const config = require('../config')
const util = require('../util')

module.exports = {
  plugin: require('@hapi/vision'),
  options: {
    engines: {
      njk: {
        compile: (src, options) => {
          const template = nunjucks.compile(src, options.environment)

          return (context) => {
            return template.render(context)
          }
        },
        prepare: (options, next) => {
          const env = options.compileOptions.environment = nunjucks.configure(path.join(options.relativeTo || process.cwd(), options.path), {
            autoescape: true,
            watch: false
          })
          env.addFilter('formatDate', util.formatDate)
          return next()
        }
      }
    },
    path: 'app/views',
    isCached: !config.isDev,
    context: {
      assetPath: '/assets',
      appName: config.appName
    }
  }
}
