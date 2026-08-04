# Deployment & Setup Guide

## Initial Admin Setup

When deploying the application for the first time, you need to initialize your admin account.

### Option 1: Local Development

1. Make sure MongoDB is running
2. Run the seed script with your admin credentials:

```bash
ADMIN_EMAIL=your@email.com \
ADMIN_NAME="Your Name" \
ADMIN_PASSWORD="YourPassword123!" \
npm run seed:admin
```

### Option 2: Docker Deployment

1. Start the containers:
```bash
docker compose up -d
```

2. Run the seed script in the container:
```bash
docker exec dream-league-finance-api npm run seed:admin -- \
  --email your@email.com \
  --name "Your Name" \
  --password "YourPassword123!"
```

Or use environment variables:
```bash
docker exec dream-league-finance-api \
  sh -c 'ADMIN_EMAIL=your@email.com ADMIN_NAME="Your Name" ADMIN_PASSWORD="YourPassword123!" npm run seed:admin'
```

### What the Seed Script Does

- Creates a manager record for you in the database
- Sets your email and hashed password
- Marks your account as admin
- Prevents anyone else from becoming admin after this

### After Seeding

1. Go to http://localhost:3000/login (or your domain)
2. Login with your email and password
3. Go to Admin > Managers to add other managers
4. Those managers only need to login (no registration) with credentials you create for them

## Important Notes

- The seed script will fail if an admin already exists (safety feature)
- Passwords must be at least 8 characters
- Only you as admin can:
  - Add/edit/delete managers
  - Access transaction features
  - Configure fees and prizes
  - Set up prize plans
  
- Regular managers can only:
  - View finance reports
  - See their balances and winnings
  - Login to access the system
