// Test new Supabase connection and create tables
const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres.ttxtipmzhsiyupebgoai:DBPASSWORD12345@aws-0-us-west-1.pooler.supabase.com:6543/postgres";

async function setupDatabase() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    console.log('🔗 Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    // Create tables manually
    console.log('📋 Creating tables...');
    
    // Create users table
    await client.query(`
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
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Users table created');
    
    // Create bets table
    await client.query(`
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
        "betTimestamp" TIMESTAMP DEFAULT NOW(),
        "paymentIntentId" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Bets table created');
    
    // Create wins table
    await client.query(`
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
        status TEXT DEFAULT 'PENDING',
        "orderNumber" TEXT,
        "trackingNumber" TEXT,
        "estimatedDelivery" TIMESTAMP,
        "actualDelivery" TIMESTAMP,
        notes TEXT,
        "winTimestamp" TIMESTAMP DEFAULT NOW(),
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Wins table created');
    
    // Test inserting data
    console.log('🧪 Testing data operations...');
    
    const userId = 'test_' + Date.now();
    await client.query(`
      INSERT INTO users (id, email, name, street, city, state, "zipCode", country)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [userId, 'test@shopspin.com', 'Test User', '123 Test St', 'Test City', 'CA', '12345', 'US']);
    
    console.log('✅ Test user created');
    
    // Count records
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    const betCount = await client.query('SELECT COUNT(*) FROM bets');
    
    console.log(`📊 Database has ${userCount.rows[0].count} users and ${betCount.rows[0].count} bets`);
    console.log('🎉 Supabase setup complete and working!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    await client.end();
  }
}

setupDatabase();