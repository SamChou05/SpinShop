// Test script to simulate the complete ShopSpin workflow
const SERVER_URL = 'http://localhost:3000';

async function testWorkflow() {
  console.log('🧪 Testing ShopSpin Workflow...\n');

  // Step 1: Test server connection
  console.log('1️⃣  Testing server connection...');
  try {
    const response = await fetch(`${SERVER_URL}/api/stats`);
    const data = await response.json();
    console.log('✅ Server is running:', data);
  } catch (error) {
    console.log('❌ Server not running. Start with: cd shopspin-server && npm run dev');
    return;
  }

  // Step 2: Create a test user
  console.log('\n2️⃣  Creating test user...');
  const testUser = {
    email: 'test@example.com',
    name: 'John Test User',
    address: {
      street: '123 Test Street',
      city: 'Testville',
      state: 'CA',
      zipCode: '90210',
      country: 'United States'
    },
    phone: '555-123-4567'
  };

  const userResponse = await fetch(`${SERVER_URL}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  });
  const userData = await userResponse.json();
  console.log('✅ User created:', userData.data?.name, userData.data?.id);

  // Step 3: Record a test win
  console.log('\n3️⃣  Recording test win...');
  const testWin = {
    userId: userData.data.id,
    product: {
      name: 'iPhone 15 Pro - Test Product',
      price: 999.99,
      currency: 'USD',
      url: 'https://www.amazon.com/dp/B0CHX1W3N6',
      image: 'https://example.com/iphone.jpg'
    },
    stakeAmount: 50.00,
    probability: 0.05 // 5% chance
  };

  const winResponse = await fetch(`${SERVER_URL}/api/wins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testWin)
  });
  const winData = await winResponse.json();
  console.log('✅ Win recorded:', winData.success ? winData.data?.id : winData.error);

  // Step 4: Check updated stats
  console.log('\n4️⃣  Checking updated statistics...');
  const statsResponse = await fetch(`${SERVER_URL}/api/stats`);
  const stats = await statsResponse.json();
  console.log('✅ Updated stats:', {
    totalUsers: stats.data.totalUsers,
    totalWins: stats.data.totalWins,
    totalValue: `$${stats.data.totalValue}`,
    pendingWins: stats.data.pendingWins
  });

  // Step 5: Test win status update (only if win was successful)
  if (winData.success && winData.data?.id) {
    console.log('\n5️⃣  Testing win status update...');
    const updateResponse = await fetch(`${SERVER_URL}/api/wins/${winData.data.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'processing',
      orderDetails: {
        orderNumber: 'AMZ-123456789',
        notes: 'Test order processed'
      }
    })
  });
  const updateData = await updateResponse.json();
  console.log('✅ Win status updated to:', updateData.data?.status);
  } else {
    console.log('\n❌ Skipping status update - win recording failed');
  }

  console.log('\n🎉 Workflow test completed successfully!');
  console.log('\n📊 Next steps:');
  console.log('1. Visit http://localhost:3000/admin to see the admin dashboard');
  console.log('2. Load the extension in Chrome and test on a real product page');
  console.log('3. Try winning a spin to see the full user registration flow');
}

// Run the test
testWorkflow().catch(console.error);