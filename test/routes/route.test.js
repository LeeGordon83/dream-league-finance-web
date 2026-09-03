/* eslint-disable no-undef */
// Must be set before the app config module is first required.
process.env.PORT = process.env.PORT || '3100'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'
process.env.API_HOST = `http://localhost:${process.env.PORT}/api`
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dream-league-finance'

const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const createServer = require('../../app/server')
const connectDB = require('../../app/api-server/db')

let server

// Routes backed by admin-only API endpoints need a real signed token.
const adminToken = jwt.sign(
  { id: 'test-admin', email: 'admin@test.local', scope: ['admin'] },
  process.env.JWT_SECRET,
  { algorithm: 'HS256', expiresIn: '1h' }
)

const asAdmin = (url) => ({
  method: 'GET',
  url,
  headers: { cookie: `dl_token=${adminToken}` }
})

beforeAll(async () => {
  await connectDB()
  server = await createServer()
  // The app calls its own /api routes over HTTP, so it must be listening.
  await server.start()
})

afterAll(async () => {
  await server.stop()
  await mongoose.disconnect()
})

describe('public views', () => {
  test('returns the home view', async () => {
    const response = await server.inject({ method: 'GET', url: '/' })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Dream League Finance')
  })

  test('returns the login view', async () => {
    const response = await server.inject({ method: 'GET', url: '/login' })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Login')
  })

  test('returns the forgot password view', async () => {
    const response = await server.inject({ method: 'GET', url: '/forgot-password' })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Password reset')
  })

  test('returns the about view', async () => {
    const response = await server.inject({ method: 'GET', url: '/about' })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('About')
  })

  test('returns the cookies view', async () => {
    const response = await server.inject({ method: 'GET', url: '/cookies' })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Cookies')
  })

  test('returns the prizes view', async () => {
    const response = await server.inject({ method: 'GET', url: '/prizes' })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Prizes')
  })
})

describe('finance views', () => {
  const cases = [
    ['/finance/all-transactions', 'All Transactions'],
    ['/finance/balance-sheet', 'Balance'],
    ['/finance/credit', 'Credit'],
    ['/finance/game-weeks', 'Game Week'],
    ['/finance/individual-winnings', 'Individual Winnings'],
    ['/finance/paid-in', 'Paid In'],
    ['/finance/winnings', 'Winnings']
  ]

  test.each(cases)('returns %s', async (url, expected) => {
    const response = await server.inject({ method: 'GET', url })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain(expected)
  })
})

describe('admin views', () => {
  const cases = [
    ['/admin/fees', 'Fees'],
    ['/admin/managers', 'Managers'],
    ['/admin/prizes', 'Prizes'],
    ['/admin/season', 'Season']
  ]

  test.each(cases)('returns %s for an admin', async (url, expected) => {
    const response = await server.inject(asAdmin(url))

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain(expected)
  })

  test.each(cases)('redirects %s away when signed out', async (url) => {
    const response = await server.inject({ method: 'GET', url })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/')
  })
})

describe('transaction views', () => {
  const cases = [
    ['/transaction/select-transaction', 'Transaction Menu'],
    ['/transaction/adhoc', 'Ad-Hoc Payment'],
    ['/transaction/fivers', 'Fivers'],
    ['/transaction/jackpot', 'Jackpot'],
    ['/transaction/league-cup', 'League and Cup Payments'],
    ['/transaction/weekly', 'Weekly Prize']
  ]

  test.each(cases)('returns %s for an admin', async (url, expected) => {
    const response = await server.inject(asAdmin(url))

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain(expected)
  })
})

describe('api routes', () => {
  test('health endpoint responds', async () => {
    const response = await server.inject({ method: 'GET', url: '/api/health' })

    expect(response.statusCode).toBe(200)
    expect(response.result.status).toBe('ok')
  })

  test('admin api rejects a request with no token', async () => {
    const response = await server.inject({ method: 'GET', url: '/api/admin/fees' })

    expect(response.statusCode).toBe(401)
  })

  test('admin api rejects a non-admin token', async () => {
    const userToken = jwt.sign(
      { id: 'u1', email: 'user@test.local', scope: ['user'] },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '1h' }
    )

    const response = await server.inject({
      method: 'GET',
      url: '/api/admin/fees',
      headers: { authorization: `Bearer ${userToken}` }
    })

    expect(response.statusCode).toBe(401)
  })

  test('admin api accepts an admin token', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/admin/fees',
      headers: { authorization: `Bearer ${adminToken}` }
    })

    expect(response.statusCode).toBe(200)
  })

  test('api errors return json rather than an html error page', async () => {
    const response = await server.inject({ method: 'GET', url: '/api/admin/fees' })

    expect(response.headers['content-type']).toContain('application/json')
  })

  test('paid in groups months by name rather than by object', async () => {
    const response = await server.inject({ method: 'GET', url: '/api/finance/paid-in' })

    expect(response.statusCode).toBe(200)

    const grouped = (response.result.managersPaidIn || []).flatMap(manager => manager.groupedTransactions || [])
    grouped.forEach(entry => expect(typeof entry.monthName).toBe('string'))
  })
})

describe('not found handling', () => {
  test.each([
    ['/history'],
    ['/admin/email'],
    ['/transaction/ad-hoc']
  ])('returns the 404 view for %s', async (url) => {
    const response = await server.inject(asAdmin(url))

    expect(response.statusCode).toBe(404)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.result).toContain('Page not found')
  })
})
