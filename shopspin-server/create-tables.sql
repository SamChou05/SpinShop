-- Create tables for ShopSpin application
-- Run this in Supabase SQL Editor if direct connection doesn't work

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    country TEXT NOT NULL,
    phone TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create win status enum
CREATE TYPE win_status AS ENUM ('PENDING', 'PROCESSING', 'ORDERED', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- Create bets table
CREATE TABLE IF NOT EXISTS bets (
    id TEXT PRIMARY KEY,
    "userId" TEXT REFERENCES users(id) ON DELETE CASCADE,
    "productName" TEXT NOT NULL,
    "productPrice" DECIMAL NOT NULL,
    "productCurrency" TEXT DEFAULT 'USD',
    "productUrl" TEXT NOT NULL,
    "productImage" TEXT,
    "stakeAmount" DECIMAL NOT NULL,
    probability DECIMAL NOT NULL,
    won BOOLEAN NOT NULL,
    "betTimestamp" TIMESTAMPTZ DEFAULT NOW(),
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create wins table
CREATE TABLE IF NOT EXISTS wins (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "productName" TEXT NOT NULL,
    "productPrice" DECIMAL NOT NULL,
    "productCurrency" TEXT DEFAULT 'USD',
    "productUrl" TEXT NOT NULL,
    "productImage" TEXT,
    "stakeAmount" DECIMAL NOT NULL,
    probability DECIMAL NOT NULL,
    status win_status DEFAULT 'PENDING',
    "orderNumber" TEXT,
    "trackingNumber" TEXT,
    "estimatedDelivery" TIMESTAMPTZ,
    "actualDelivery" TIMESTAMPTZ,
    notes TEXT,
    "winTimestamp" TIMESTAMPTZ DEFAULT NOW(),
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bets_userId ON bets("userId");
CREATE INDEX IF NOT EXISTS idx_bets_timestamp ON bets("betTimestamp");
CREATE INDEX IF NOT EXISTS idx_wins_userId ON wins("userId");
CREATE INDEX IF NOT EXISTS idx_wins_status ON wins(status);
CREATE INDEX IF NOT EXISTS idx_wins_timestamp ON wins("winTimestamp");