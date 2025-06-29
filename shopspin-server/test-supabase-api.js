require('dotenv').config();

async function testSupabaseAPI() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('🔍 Testing Supabase REST API...');
  console.log('URL:', SUPABASE_URL);
  
  try {
    // Test connection to Supabase API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    
    console.log('API Response Status:', response.status);
    
    if (response.ok) {
      console.log('✅ Supabase API is accessible');
      
      // Try to get schema info
      const schemaResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Accept': 'application/vnd.pgrst.object+json'
        }
      });
      
      const schema = await schemaResponse.text();
      console.log('📋 Available endpoints:', schema);
      
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error testing Supabase API:', error.message);
  }
}

testSupabaseAPI();