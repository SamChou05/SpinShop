# ShopSpin Server Deployment Guide

## Vercel Deployment

### Prerequisites
1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`

### Deploy Steps
1. Navigate to the server directory:
   ```bash
   cd shopspin-server
   ```

2. Deploy to production:
   ```bash
   vercel deploy --prod
   ```

### Environment Variables
Set these environment variables in Vercel dashboard:
- `DATABASE_URL`: PostgreSQL connection string from Railway
- `ADMIN_PASSWORD`: Admin authentication password
- `NODE_ENV`: "production"

## Database Setup (Railway)

1. Go to [railway.app](https://railway.app)
2. Create new project with PostgreSQL
3. Copy the connection string and update `DATABASE_URL` in Vercel
4. Run database migration:
   ```bash
   npx prisma db push
   ```

## Post-Deployment
1. Update Chrome extension URLs to point to production server
2. Test all API endpoints
3. Verify admin authentication works
4. Test betting functionality end-to-end

## Current Status
✅ Code is production-ready
✅ Prisma database service implemented
✅ Environment variables configured
⏳ Needs manual Vercel login to complete deployment
⏳ Needs Railway database setup