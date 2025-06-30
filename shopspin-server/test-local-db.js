// Quick test with local SQLite database
const { PrismaClient } = require('@prisma/client');

// Override DATABASE_URL to use SQLite for testing
process.env.DATABASE_URL = "file:./test.db";

const prisma = new PrismaClient();

async function testLocalConnection() {
  try {
    console.log('🔄 Testing with local SQLite database...');
    
    // This will create the database file and tables automatically
    await prisma.$connect();
    console.log('✅ Connected to local database');
    
    // Test creating a user
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        street: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        country: 'US',
        phone: '555-1234'
      }
    });
    
    console.log('✅ Created test user:', testUser.id);
    
    // Test creating a bet
    const testBet = await prisma.bet.create({
      data: {
        userId: testUser.id,
        productName: 'Test Product',
        productPrice: 99.99,
        productUrl: 'https://example.com/product',
        stakeAmount: 10.00,
        probability: 0.1,
        won: false,
        betTimestamp: new Date()
      }
    });
    
    console.log('✅ Created test bet:', testBet.id);
    
    // Count records
    const userCount = await prisma.user.count();
    const betCount = await prisma.bet.count();
    
    console.log(`📊 Database contains: ${userCount} users, ${betCount} bets`);
    console.log('🎉 All database operations working correctly!');
    
  } catch (error) {
    console.error('❌ Local database test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLocalConnection();