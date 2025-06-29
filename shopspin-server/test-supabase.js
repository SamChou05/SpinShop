// Test script to verify Supabase connection
const { PrismaClient } = require('@prisma/client');

async function testSupabaseConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Testing Supabase connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Connected to Supabase database');
    
    // Test query
    const userCount = await prisma.user.count();
    console.log(`📊 Current user count: ${userCount}`);
    
    // Test create/read (create anonymous user if doesn't exist)
    let anonymousUser = await prisma.user.findUnique({
      where: { email: 'anonymous@shopspin.system' }
    });
    
    if (!anonymousUser) {
      console.log('🔧 Creating anonymous user for production...');
      anonymousUser = await prisma.user.create({
        data: {
          email: 'anonymous@shopspin.system',
          name: 'Anonymous User',
          street: '1 Hacker Way',
          city: 'Menlo Park',
          state: 'CA',
          zipCode: '94025',
          country: 'US',
          phone: '555-000-0000'
        }
      });
      console.log('✅ Anonymous user created:', anonymousUser.id);
    } else {
      console.log('✅ Anonymous user exists:', anonymousUser.id);
    }
    
    console.log('🎉 Supabase setup is working correctly!');
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    console.error('💡 Check your DATABASE_URL in .env file');
  } finally {
    await prisma.$disconnect();
  }
}

testSupabaseConnection();