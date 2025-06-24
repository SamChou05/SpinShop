// Temporary script to test forcing a win for debugging

// This will simulate the exact message flow when a user wins
const testProduct = {
  name: 'Test iPhone 15 Pro',
  price: 999.99,
  currency: 'USD',
  url: 'https://www.amazon.com/test'
};

const testStake = 50.00;

// Test with Chrome extension
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('🧪 Testing win flow with Chrome extension...');
  
  // First, test getting current user (should be null for new user)
  chrome.runtime.sendMessage({
    type: 'REGISTER_USER',
    userInfo: {
      email: 'debug@test.com',
      name: 'Debug User',
      address: {
        street: '123 Debug St',
        city: 'Test City',
        state: 'CA',
        zipCode: '90210',
        country: 'United States'
      }
    }
  }, (regResponse) => {
    console.log('Registration response:', regResponse);
    
    // Now try the spin
    chrome.runtime.sendMessage({
      type: 'ENTER_SPIN',
      product: testProduct,
      stake: testStake
    }, (spinResponse) => {
      console.log('Spin response:', spinResponse);
      
      if (spinResponse.requiresUserInfo) {
        console.log('✅ Should show user registration form');
      } else if (spinResponse.won) {
        console.log('✅ Win recorded directly to server');
      } else {
        console.log('❌ Lost the spin');
      }
    });
  });
} else {
  console.log('❌ Chrome extension API not available. Run this in a page with the extension loaded.');
}