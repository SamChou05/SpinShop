// Create missing WinStatus enum
const { Client } = require('pg');

async function createEnum() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres.ttxtipmzhsiyupebgoai:DBPASSWORD12345@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&prepared_statements=false",
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Create the enum if it doesn't exist
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WinStatus') THEN
          CREATE TYPE "WinStatus" AS ENUM (
            'PENDING',
            'PROCESSING', 
            'ORDERED',
            'SHIPPED',
            'DELIVERED',
            'CANCELLED'
          );
        END IF;
      END $$;
    `);
    
    console.log('✅ WinStatus enum created successfully');
    
    // Verify it exists
    const result = await client.query(`
      SELECT enumlabel 
      FROM pg_enum e 
      JOIN pg_type t ON e.enumtypid = t.oid 
      WHERE t.typname = 'WinStatus'
    `);
    
    console.log('📋 WinStatus values:', result.rows.map(r => r.enumlabel));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createEnum();