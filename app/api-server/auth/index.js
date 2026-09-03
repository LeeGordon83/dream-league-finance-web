const isInScope = (credentials, scope) => {
  if (!credentials || !credentials.scope) {
    return false
  }

  if (Array.isArray(credentials.scope)) {
    return credentials.scope.includes(scope)
  }

  if (typeof credentials.scope === 'string') {
    return credentials.scope.split(/\s+/).includes(scope)
  }

  return false
}

const requireAdmin = (request, h) => {
  const boom = require('@hapi/boom')

  const isAuthenticated = Boolean(request?.auth?.isAuthenticated)
  const hasAdminScope = isInScope(request?.auth?.credentials, 'admin')

  if (!isAuthenticated || !hasAdminScope) {
    throw boom.unauthorized('Admin access required')
  }

  return h.continue
}

module.exports = {
  isInScope,
  requireAdmin
}
