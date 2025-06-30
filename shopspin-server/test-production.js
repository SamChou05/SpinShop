// Test production API directly
const PRODUCTION_URL = "https://shopspin-server-dj3pzh8d3-sam-chous-projects-77de4009.vercel.app";

async function testProductionAPI() {
  console.log('🔗 Testing production API...');
  console.log('📍 URL:', PRODUCTION_URL);
  
  try {
    // Test the stats endpoint with proper headers
    const response = await fetch(`${PRODUCTION_URL}/api/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ShopSpin-Extension/1.0'
      }
    });
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', data);
    } else {
      const text = await response.text();
      console.log('❌ API Error:', text.substring(0, 200) + '...');
    }
    
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

testProductionAPI();