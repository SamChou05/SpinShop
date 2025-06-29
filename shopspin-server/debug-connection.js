require('dotenv').config();
const { Client } = require('pg');
const { parse } = require('pg-connection-string');

async function debugConnection() {
  console.log('🔍 DEBUG: Connection String Analysis');
  console.log('Raw DATABASE_URL:', process.env.DATABASE_URL);
  
  try {
    // Parse the connection string
    const config = parse(process.env.DATABASE_URL);
    console.log('Parsed connection config:');
    console.log('  Host:', config.host);
    console.log('  Port:', config.port);
    console.log('  User:', config.user);
    console.log('  Database:', config.database);
    console.log('  SSL:', config.ssl);
    
    // Try to connect with explicit config
    const client = new Client(config);
    
    console.log('\n🔄 Attempting connection...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL version:', result.rows[0].version);
    
    await client.end();
    console.log('🎉 Connection test successful!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', error);
  }
}

debugConnection();