module.exports = [{
  method: 'GET',
  path: '/favicon.ico',
  handler: {
    file: 'app/public/assets/Icon.ico'
  }
}, {
  method: 'GET',
  path: '/assets/{path*}',
  handler: {
    directory: {
      path: [
        'app/public/css',
        'app/public/js',
        'app/public/assets'
      ]
    }
  }
}]
