# Database Setup Instructions

## Option 1: Railway (Recommended for Production)

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click "New Project" → "Provision PostgreSQL"
3. Once created, go to the PostgreSQL service
4. Copy the connection string from "Connect" tab
5. Update `.env.production` with the connection string:
   ```
   DATABASE_URL="postgresql://postgres:password@host:port/database"
   ```
6. Run the migration:
   ```bash
   cd shopspin-server
   npx prisma db push
   ```

## Option 2: Supabase (Alternative)

1. Go to [supabase.com](https://supabase.com) and create a project
2. Go to Settings → Database
3. Copy the connection string
4. Update `.env.production` with the connection string
5. Run the migration:
   ```bash
   cd shopspin-server
   npx prisma db push
   ```

## Option 3: Local Development

For local testing, install PostgreSQL:
```bash
# macOS
brew install postgresql
brew services start postgresql

# Create database
createdb shopspin_dev

# Update .env.development
DATABASE_URL="postgresql://postgres@localhost:5432/shopspin_dev"
```

## Current Database Schema

The Prisma schema includes:
- **User**: email, name, address, phone
- **Bet**: userId, product details, stake, probability, outcome
- **Win**: userId, product details, prize value, status

All tables have proper relationships and constraints.