#!/usr/bin/env node

/**
 * Startup script - runs seed-admin if env vars are provided and no admin exists yet.
 * Then starts the main application.
 */

const { execSync } = require('child_process')

const hasAdminEnvVars = process.env.ADMIN_EMAIL && process.env.ADMIN_NAME && process.env.ADMIN_PASSWORD

if (hasAdminEnvVars) {
  console.log('Admin seed env vars detected — attempting to seed admin...')
  try {
    execSync('node scripts/seed-admin.js', { stdio: 'inherit' })
  } catch {
    // seed-admin exits with code 1 if admin already exists — that's fine, just continue
  }
}

// Start the main app
require('./index.js')
