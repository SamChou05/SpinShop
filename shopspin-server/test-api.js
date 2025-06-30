// Test API endpoints
async function testAPI() {
  console.log('🔗 Testing API endpoints...');
  
  try {
    const response = await fetch('http://localhost:3001/api/stats');
    console.log('📊 Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', data);
    } else {
      const text = await response.text();
      console.log('❌ API Error:', text);
    }
    
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

testAPI();