# Set Up New Supabase Database

## Quick Setup (5 minutes)

1. **Go to Supabase**: Visit [supabase.com](https://supabase.com)
2. **Create Account**: Sign up or log in
3. **New Project**: Click "New project"
4. **Project Details**:
   - Name: `shopspin-production`
   - Database Password: Create a strong password
   - Region: Choose closest to your users
5. **Wait for Setup**: Project creation takes ~2 minutes

## Get Connection String

1. **Go to Settings** → **Database**
2. **Copy Connection String**: Look for "Connection string"
3. **Use this format**:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

## Update Environment

Replace your DATABASE_URL in `.env.production`:
```bash
DATABASE_URL="postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres"
```

## Test Connection

Run the test script:
```bash
node test-supabase.js
```

## Create Tables

Once connection works:
```bash
npx prisma db push
```

This will create all your tables (users, bets, wins) automatically.