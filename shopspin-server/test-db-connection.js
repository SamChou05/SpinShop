const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔄 Testing direct PostgreSQL connection...');
    await client.connect();
    console.log('✅ Connected to Supabase!');
    
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL version:', result.rows[0].version);
    
    await client.end();
    console.log('🎉 Connection test successful!');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('⏰ If project was just created, wait 2-3 minutes and try again');
  }
}

testConnection();