#!/usr/bin/env node

/**
 * Seed script to initialize admin user
 * 
 * Usage:
 *   ADMIN_EMAIL=your@email.com ADMIN_NAME="Your Name" ADMIN_PASSWORD="YourPassword123!" node scripts/seed-admin.js
 * 
 * Or in Docker:
 *   docker exec <container> node scripts/seed-admin.js
 */

const bcrypt = require('bcrypt')
const mongoose = require('mongoose')

const SALT_ROUNDS = 10

const Manager = require('../models/manager')

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Get admin details from environment variables
    const adminEmail = process.env.ADMIN_EMAIL
    const adminName = process.env.ADMIN_NAME
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminName || !adminPassword) {
      console.error('Error: Please provide ADMIN_EMAIL, ADMIN_NAME, and ADMIN_PASSWORD environment variables')
      process.exit(1)
    }

    const normalizedEmail = String(adminEmail).trim().toLowerCase()

    // Check if an admin already exists
    const existingAdmin = await Manager.findOne({ isAdmin: true })
    if (existingAdmin) {
      console.error('Error: An admin user already exists in the database')
      process.exit(1)
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS)

    // Create or update manager with admin credentials
    const managerId = String(Date.now())
    const manager = await Manager.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: {
          managerId,
          managerName: adminName,
          email: normalizedEmail,
          passwordHash,
          isAdmin: true,
          active: true
        }
      },
      { upsert: true, new: true }
    )

    console.log('✓ Admin user initialized successfully')
    console.log(`  Email: ${manager.email}`)
    console.log(`  Name: ${manager.managerName}`)
    console.log(`  Admin: ${manager.isAdmin}`)
    console.log('\nYou can now login at /login')

    await mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    console.error('Error seeding admin user:', error.message)
    process.exit(1)
  }
}

seedAdmin()
