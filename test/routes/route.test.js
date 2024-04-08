/* eslint-disable no-undef */
const createServer = require('../../app/server')
let server

describe('GET /', () => {
  beforeEach(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('returns the home view', async () => {
    const request = {
      method: 'GET',
      url: '/'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Dream League Finance')
  })
  test('returns the login view', async () => {
    const request = {
      method: 'GET',
      url: '/login'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Login')
  })
  test('returns the register view', async () => {
    const request = {
      method: 'GET',
      url: '/login'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Register')
  })
  test('returns the forgot password  view', async () => {
    const request = {
      method: 'GET',
      url: '/forgot-password'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Password reset')
  })
  test('returns the admin email view', async () => {
    const request = {
      method: 'GET',
      url: '/admin/email'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Email Hub')
  })
  test('returns the admin fees view', async () => {
    const request = {
      method: 'GET',
      url: '/admin/fees'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Fees')
  })
  test('returns the admin managers view', async () => {
    const request = {
      method: 'GET',
      url: '/admin/managers'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Managers')
  })
  test('returns the admin prizes view', async () => {
    const request = {
      method: 'GET',
      url: '/admin/prizes'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Prizes')
  })
  test('returns the admin season view', async () => {
    const request = {
      method: 'GET',
      url: '/admin/season'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Season')
  })

  test('returns the cookie policy view', async () => {
    const request = {
      method: 'GET',
      url: '/cookies'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Cookies')
  })
  test('returns the finance all transactions view', async () => {
    const request = {
      method: 'GET',
      url: '/finance/all-transactions'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('All Transactions')
  })
  test('returns the finance balance sheet view', async () => {
    const request = {
      method: 'GET',
      url: '/finance/all-transactions'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Balance')
  })
  test('returns the finance credit view', async () => {
    const request = {
      method: 'GET',
      url: '/finance/credit'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Credit')
  })
  test('returns the finance game weeks view', async () => {
    const request = {
      method: 'GET',
      url: '/finance/game-weeks'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Game Week')
  })
  test('returns the finance individual winnings view', async () => {
    const request = {
      method: 'GET',
      url: '/finance/individual-winnings'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Individual Winnings')
  })
  test('returns the finance paid in view', async () => {
    const request = {
      method: 'GET',
      url: '/finance/paid-in'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Paid In')
  })
  test('returns the finance winnings view', async () => {
    const request = {
      method: 'GET',
      url: '/finance/winnings'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Winnings')
  })
  test('returns the transaction adhoc view', async () => {
    const request = {
      method: 'GET',
      url: '/transaction/adhoc'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Ad-Hoc Payment')
  })

  test('returns the transaction fivers view', async () => {
    const request = {
      method: 'GET',
      url: '/transaction/fivers'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Fivers')
  })

  test('returns the transaction jackpot view', async () => {
    const request = {
      method: 'GET',
      url: '/transaction/jackpot'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Jackpot')
  })
  test('returns the transaction league/cup view', async () => {
    const request = {
      method: 'GET',
      url: '/transaction/league-cup'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('League and Cup Payments')
  })
  test('returns the transaction select transaction view', async () => {
    const request = {
      method: 'GET',
      url: '/transaction/select-transaction'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Transaction Menu')
  })
  test('returns the transaction weekly view', async () => {
    const request = {
      method: 'GET',
      url: '/transaction/weekly'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Weekly Prize')
  })
  test('returns the about view', async () => {
    const request = {
      method: 'GET',
      url: '/about'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('About')
  })
  test('returns the history view', async () => {
    const request = {
      method: 'GET',
      url: '/history'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('History')
  })
  test('returns the cookies view', async () => {
    const request = {
      method: 'GET',
      url: '/cookies'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Cookies')
  })
  test('returns the transaction adhoc view', async () => {
    const request = {
      method: 'GET',
      url: '/transaction/ad-hoc'
    }

    const response = await server.inject(request)

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Ad-Hoc Payment')
  })
})
