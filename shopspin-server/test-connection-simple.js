// Simple connection test
require('dotenv').config({ path: '.env.production' });

const { Client } = require('pg');

async function testPostgreSQLConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔗 Testing PostgreSQL connection...');
    console.log('📍 Connecting to:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@'));
    
    await client.connect();
    console.log('✅ Successfully connected to PostgreSQL!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time, version()');
    console.log('⏰ Database time:', result.rows[0].current_time);
    console.log('🗄️  PostgreSQL version:', result.rows[0].version.split(' ')[0], result.rows[0].version.split(' ')[1]);
    
    // Test if our tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'bets', 'wins')
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('📋 Tables found:', tablesResult.rows.map(row => row.table_name));
    } else {
      console.log('⚠️  No tables found. Run: npx prisma db push');
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 Hostname not found - check your DATABASE_URL');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Connection refused - database server may be down');
    } else if (error.message.includes('password')) {
      console.log('💡 Authentication failed - check your password');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('💡 Database does not exist - check database name');
    }
  } finally {
    await client.end();
  }
}

console.log('DATABASE_URL is', process.env.DATABASE_URL ? 'set' : 'NOT SET');
testPostgreSQLConnection();