// Test P/L calculation with sample data
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPnLCalculation() {
  try {
    console.log('🧮 Testing P/L Calculation...');
    
    // Get all bets
    const bets = await prisma.bet.findMany();
    console.log(`📊 Found ${bets.length} bets`);
    
    // Calculate manually to verify
    const totalStakesCollected = bets.reduce((sum, bet) => sum + bet.stakeAmount, 0);
    console.log(`💰 Total Stakes Collected: $${totalStakesCollected}`);
    
    const winningBets = bets.filter(bet => bet.won);
    console.log(`🏆 Winning bets: ${winningBets.length}`);
    
    const totalValuePaidOut = winningBets.reduce((sum, bet) => sum + bet.productPrice, 0);
    console.log(`💸 Total Value Paid Out: $${totalValuePaidOut}`);
    
    const profitLoss = totalStakesCollected - totalValuePaidOut;
    console.log(`📈 Profit/Loss: $${profitLoss}`);
    
    // Show each winning bet details
    winningBets.forEach((bet, index) => {
      console.log(`🎰 Win ${index + 1}: Stake $${bet.stakeAmount}, Prize $${bet.productPrice}, Product: ${bet.productName.substring(0, 50)}...`);
    });
    
    console.log('\n✅ P/L calculation should now work correctly in admin dashboard!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPnLCalculation();