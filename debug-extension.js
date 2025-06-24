// Debug script to run in the browser console on an Amazon page
// This will test the extension's server communication

console.log('🔍 Testing extension server communication...');

// Test if we can access the chrome extension API
if (typeof chrome === 'undefined' || !chrome.runtime) {
  console.log('❌ Chrome extension API not available');
} else {
  console.log('✅ Chrome extension API available');
  
  // Test the complete registration + win flow
  console.log('🧪 Testing complete win flow...');
  
  const testProduct = {
    name: 'Extension Test iPhone',
    price: 999.99,
    currency: 'USD',
    url: window.location.href
  };
  
  const testUserInfo = {
    email: 'extensiontest@example.com',
    name: 'Extension Test User',
    address: {
      street: '123 Extension Test St',
      city: 'Test City',
      state: 'CA',
      zipCode: '90210',
      country: 'United States'
    }
  };
  
  const testStake = 75.00;
  
  console.log('📝 Step 1: Testing COMPLETE_WIN message...');
  chrome.runtime.sendMessage({
    type: 'COMPLETE_WIN',
    product: testProduct,
    stake: testStake,
    userInfo: testUserInfo
  }, (response) => {
    console.log('🎯 COMPLETE_WIN response:', response);
    
    if (response && response.won) {
      console.log('✅ Extension successfully recorded win to server!');
      console.log('🔄 Check admin dashboard now for: Extension Test User');
    } else {
      console.log('❌ Extension failed to record win:', response);
    }
  });
  
  // Also test individual steps
  setTimeout(() => {
    console.log('📝 Step 2: Testing USER REGISTRATION...');
    chrome.runtime.sendMessage({
      type: 'REGISTER_USER',
      userInfo: {
        ...testUserInfo,
        email: 'extensiontest2@example.com',
        name: 'Extension Test User 2'
      }
    }, (regResponse) => {
      console.log('👤 Registration response:', regResponse);
      
      if (regResponse && regResponse.success) {
        console.log('📝 Step 3: Testing WIN RECORDING with registered user...');
        chrome.runtime.sendMessage({
          type: 'ENTER_SPIN',
          product: {
            ...testProduct,
            name: 'Extension Test iPhone 2'
          },
          stake: testStake
        }, (spinResponse) => {
          console.log('🎲 Spin response:', spinResponse);
        });
      }
    });
  }, 2000);
}

// Also test direct fetch from content script context
console.log('🌐 Testing direct fetch from content script context...');
fetch('http://localhost:3000/api/stats')
  .then(response => response.json())
  .then(data => {
    console.log('✅ Direct fetch from content context works:', data);
  })
  .catch(error => {
    console.log('❌ Direct fetch from content context failed:', error);
  });