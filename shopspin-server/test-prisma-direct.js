// Test Prisma client directly
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPrismaClient() {
  try {
    console.log('🔗 Testing Prisma client...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Prisma client connected!');
    
    // Test query
    const userCount = await prisma.user.count();
    console.log('👥 Users found:', userCount);
    
    const betCount = await prisma.bet.count();
    console.log('🎰 Bets found:', betCount);
    
    console.log('🎉 Prisma client working correctly!');
    
  } catch (error) {
    console.error('❌ Prisma client error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaClient();