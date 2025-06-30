// Test Supabase with connection pooler
require('dotenv').config({ path: '.env.production' });
const { Client } = require('pg');

async function testWithPooler() {
  // Try different connection formats
  const originalUrl = process.env.DATABASE_URL;
  
  // Try with pooler (port 6543)
  const poolerUrl = originalUrl.replace(':5432/', ':6543/').replace('postgres', 'postgres') + '?pgbouncer=true';
  
  console.log('🔗 Testing original connection...');
  await testConnection(originalUrl, 'Original (port 5432)');
  
  console.log('\n🔗 Testing with connection pooler...');
  await testConnection(poolerUrl, 'Pooler (port 6543)');
  
  console.log('\n🔗 Testing with IPv4 mode...');
  const ipv4Url = originalUrl + '?options=project%3Dttxtipmzhsiyupebgoai';
  await testConnection(ipv4Url, 'With project option');
}

async function testConnection(url, description) {
  const client = new Client({ connectionString: url });
  
  try {
    console.log(`📍 ${description}:`, url.replace(/:[^:]*@/, ':****@'));
    await client.connect();
    console.log(`✅ ${description} - SUCCESS!`);
    
    const result = await client.query('SELECT NOW() as time');
    console.log('⏰ Connected at:', result.rows[0].time);
    return true;
    
  } catch (error) {
    console.log(`❌ ${description} - FAILED:`, error.message);
    return false;
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
}

testWithPooler();