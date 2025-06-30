// Test API endpoints to verify database is working
async function testAPIEndpoints() {
  console.log('🔗 Testing API endpoints...');
  
  const baseUrl = 'http://localhost:3001';
  
  // Test stats endpoint
  try {
    const statsResponse = await fetch(`${baseUrl}/api/stats`);
    console.log('📊 Stats endpoint status:', statsResponse.status);
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Stats data:', statsData);
    } else {
      const errorText = await statsResponse.text();
      console.log('❌ Stats error:', errorText.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Stats fetch error:', error.message);
  }
  
  // Test creating a user
  try {
    const userResponse = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'CA',
          zipCode: '12345',
          country: 'US'
        }
      })
    });
    
    console.log('👤 User creation status:', userResponse.status);
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('✅ User created:', userData.data?.id);
    } else {
      const errorText = await userResponse.text();
      console.log('❌ User creation error:', errorText.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ User creation fetch error:', error.message);
  }
}

// Wait a moment for server to be ready, then test
setTimeout(testAPIEndpoints, 2000);