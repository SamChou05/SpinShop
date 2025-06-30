// Test development database connection
require('dotenv').config({ path: '.env.development' });
const { Client } = require('pg');

async function testDevConnection() {
  console.log('🔗 Testing development database connection...');
  console.log('📍 DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase!');
    
    // Test a simple query
    const result = await client.query('SELECT COUNT(*) as user_count FROM users');
    console.log('👥 Users in database:', result.rows[0].user_count);
    
    const betResult = await client.query('SELECT COUNT(*) as bet_count FROM bets');
    console.log('🎰 Bets in database:', betResult.rows[0].bet_count);
    
    console.log('🎉 Development database connection working!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await client.end();
  }
}

testDevConnection();