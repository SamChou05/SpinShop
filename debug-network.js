// Debug script to test the network connection from extension to server

console.log('🔍 Testing network connection from extension context...');

// Test direct fetch to server
async function testDirectFetch() {
  try {
    console.log('Testing direct fetch to server...');
    const response = await fetch('http://localhost:3000/api/stats');
    const data = await response.json();
    console.log('✅ Direct fetch successful:', data);
    return true;
  } catch (error) {
    console.error('❌ Direct fetch failed:', error);
    return false;
  }
}

// Test user creation
async function testCreateUser() {
  try {
    console.log('Testing user creation...');
    const response = await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'debug@test.com',
        name: 'Debug User',
        address: {
          street: '123 Debug St',
          city: 'Test City',
          state: 'CA',
          zipCode: '90210',
          country: 'United States'
        }
      })
    });
    const data = await response.json();
    console.log('✅ User creation response:', data);
    return data;
  } catch (error) {
    console.error('❌ User creation failed:', error);
    return null;
  }
}

// Test win recording
async function testWinRecording(userId) {
  try {
    console.log('Testing win recording...');
    const response = await fetch('http://localhost:3000/api/wins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        product: {
          name: 'Debug Test Product',
          price: 999.99,
          currency: 'USD',
          url: window.location.href
        },
        stakeAmount: 50.00,
        probability: 0.5
      })
    });
    const data = await response.json();
    console.log('✅ Win recording response:', data);
    return data;
  } catch (error) {
    console.error('❌ Win recording failed:', error);
    return null;
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Starting network tests...');
  
  const fetchWorking = await testDirectFetch();
  if (!fetchWorking) {
    console.log('❌ Basic fetch failed - server might not be running');
    return;
  }
  
  const userResult = await testCreateUser();
  if (!userResult || !userResult.success) {
    console.log('❌ User creation failed');
    return;
  }
  
  const winResult = await testWinRecording(userResult.data.id);
  if (!winResult || !winResult.success) {
    console.log('❌ Win recording failed');
    return;
  }
  
  console.log('✅ All tests passed! Check admin dashboard for new data.');
}

// Run the tests
runTests();