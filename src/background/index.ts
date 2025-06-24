import { ProductInfo } from '../content/productDetector';
import { ShopSpinAPI, SERVER_CONFIG } from '../lib/serverConfig';

interface SpinResult {
  won: boolean;
  message: string;
  paymentIntentId?: string;
  requiresUserInfo?: boolean;
}

interface UserInfo {
  email: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone?: string;
}

class BackgroundService {
  constructor() {
    this.setupMessageHandlers();
    this.setupInstallHandler();
  }

  private setupMessageHandlers() {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      switch (message.type) {
        case 'PRODUCT_FOUND':
          this.handleProductFound(message.product);
          break;
        
        case 'ENTER_SPIN':
          this.handleSpinRequest(message.product, message.stake)
            .then(sendResponse);
          return true; // Keep channel open for async response
        
        case 'INDICATOR_CLICKED':
          this.handleIndicatorClick(message.product);
          break;
        
        case 'REGISTER_USER':
          this.handleUserRegistration(message.userInfo)
            .then(sendResponse);
          return true; // Keep channel open for async response
        
        case 'COMPLETE_WIN':
          this.handleCompleteWin(message.product, message.stake, message.userInfo)
            .then(sendResponse);
          return true; // Keep channel open for async response
        
        case 'CONFIRM_EXISTING_ADDRESS':
          this.handleConfirmExistingAddress(message.product, message.stake, message.userInfo)
            .then(sendResponse);
          return true; // Keep channel open for async response
        
        default:
          break;
      }
    });
  }

  private setupInstallHandler() {
    chrome.runtime.onInstalled.addListener(() => {
      // Set default settings
      chrome.storage.sync.set({
        extensionEnabled: true,
        soundEnabled: false,
        animationsEnabled: true
      });
    });
  }

  private handleProductFound(product: ProductInfo) {
    console.log('Product detected:', product);
    // Could store analytics or validate product here
  }

  private async handleIndicatorClick(product: ProductInfo) {
    // Track indicator clicks for analytics and optimization
    const analytics = await chrome.storage.local.get(['indicatorClicks']);
    const currentClicks = analytics.indicatorClicks || [];
    
    currentClicks.push({
      timestamp: Date.now(),
      product: {
        name: product.name,
        price: product.price,
        url: product.url
      },
      domain: new URL(product.url).hostname
    });

    // Keep only last 500 clicks
    if (currentClicks.length > 500) {
      currentClicks.splice(0, currentClicks.length - 500);
    }

    await chrome.storage.local.set({ indicatorClicks: currentClicks });
    console.log('Indicator clicked for product:', product.name);
  }

  private async handleSpinRequest(product: ProductInfo, stake: number): Promise<SpinResult> {
    // Validate stake with comprehensive checks
    if (typeof stake !== 'number' || isNaN(stake)) {
      return {
        won: false,
        message: 'Invalid stake amount'
      };
    }
    
    if (stake < 0.01) {
      return {
        won: false,
        message: 'Minimum stake is $0.01'
      };
    }
    
    if (stake > 10000) {
      return {
        won: false,
        message: 'Maximum stake is $10,000'
      };
    }
    
    if (stake > product.price) {
      return {
        won: false,
        message: 'Stake cannot exceed product price'
      };
    }

    // Calculate probability with house edge
    const rawProbability = stake / product.price;
    const HOUSE_EDGE_MULTIPLIER = 0.97; // 3% house edge (97% of original odds)
    const MAX_WIN_PROBABILITY = 0.97; // Maximum 97% win chance
    const probability = Math.min(rawProbability * HOUSE_EDGE_MULTIPLIER, MAX_WIN_PROBABILITY);
    
    // Generate secure random number using crypto API
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    const randomValue = randomArray[0] / (0xFFFFFFFF + 1); // Convert to 0-1 range

    // Determine win based on actual probability
    const won = randomValue < probability;

    // Always record the bet (win or loss) for analytics and P/L tracking
    // Note: For losses, we'll record the bet immediately. For wins, we'll record it when user registers/confirms
    if (!won) {
      try {
        // For losses, always record the bet - use anonymous user if no user is registered
        const currentUser = await this.getCurrentUser();
        const userId = currentUser?.id || 'cmca1i2sb000ey73fv2sbjaqd'; // Anonymous user ID
        await this.recordBetToServer(product, stake, probability, won, userId);
      } catch (error) {
        console.error('Failed to record loss bet to server:', error);
      }
    }

    if (won) {
      // Check if user is already registered
      const userInfo = await this.getCurrentUser();
      
      if (!userInfo) {
        // User needs to provide shipping info
        return {
          won: true,
          message: 'Congratulations! You won! Please provide your shipping information to claim your prize.',
          requiresUserInfo: true
        };
      } else {
        // User is registered, show confirmation for existing address
        return {
          won: true,
          message: 'Congratulations! You won! Please confirm your shipping address.',
          requiresAddressConfirmation: true,
          existingUser: userInfo
        };
      }
    } else {
      // Store loss for analytics
      this.recordSpinResult(product, stake, false);
      
      return {
        won: false,
        message: `You needed ${(probability * 100).toFixed(1)}% but luck wasn't on your side. Try again!`
      };
    }
  }

  private async getCurrentUser(): Promise<{ id: string; email: string } | null> {
    try {
      const stored = await chrome.storage.sync.get(['userInfo']);
      const userInfo = stored.userInfo;
      
      if (!userInfo) {
        return null;
      }
      
      // Validate that the user still exists on the server
      try {
        const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/users?id=${userInfo.id}`);
        const userData = await response.json();
        
        if (!userData.success || !userData.data) {
          // User no longer exists on server, clear local storage
          console.log('🎰 BACKGROUND: User no longer exists on server, clearing local storage');
          await chrome.storage.sync.remove(['userInfo']);
          return null;
        }
        
        return userInfo;
      } catch (error) {
        console.error('Error validating user on server:', error);
        // If we can't validate, assume user exists and let other methods handle the error
        return userInfo;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  private async handleUserRegistration(userInfo: UserInfo): Promise<{ success: boolean; error?: string; userId?: string }> {
    try {
      const response = await ShopSpinAPI.createUser(userInfo);
      
      if (response.success) {
        // Store complete user info locally for address confirmation
        await chrome.storage.sync.set({ 
          userInfo: response.data
        });
        
        return { success: true, userId: response.data.id };
      } else {
        return { success: false, error: response.error || 'Unknown error' };
      }
    } catch (error) {
      console.error('User registration failed:', error);
      return { success: false, error: 'Network error' };
    }
  }

  private async handleCompleteWin(product: ProductInfo, stake: number, userInfo: UserInfo): Promise<SpinResult> {
    try {
      // First register the user
      const registrationResult = await this.handleUserRegistration(userInfo);
      
      if (!registrationResult.success) {
        return {
          won: true,
          message: `You won, but registration failed: ${registrationResult.error}. Please try again.`
        };
      }

      // Calculate probability with house edge
      const rawProbability = stake / product.price;
      const HOUSE_EDGE_MULTIPLIER = 0.97; // 3% house edge (97% of original odds)
      const MAX_WIN_PROBABILITY = 0.97; // Maximum 97% win chance
      const probability = Math.min(rawProbability * HOUSE_EDGE_MULTIPLIER, MAX_WIN_PROBABILITY);
      
      // Record the win to server
      await this.recordWinToServer(product, stake, probability, registrationResult.userId!);
      
      return {
        won: true,
        message: `Congratulations! You won ${product.name}! We've recorded your win and will contact you about shipping.`
      };
    } catch (error) {
      console.error('Complete win failed:', error);
      return {
        won: true,
        message: 'You won, but there was an error processing your win. Please contact support.'
      };
    }
  }

  private async handleConfirmExistingAddress(product: ProductInfo, stake: number, userInfo: { id: string; email: string; name: string }): Promise<SpinResult> {
    try {
      // Calculate probability with house edge
      const rawProbability = stake / product.price;
      const HOUSE_EDGE_MULTIPLIER = 0.97; // 3% house edge (97% of original odds)
      const MAX_WIN_PROBABILITY = 0.97; // Maximum 97% win chance
      const probability = Math.min(rawProbability * HOUSE_EDGE_MULTIPLIER, MAX_WIN_PROBABILITY);
      
      // Record the win to server using existing user ID
      await this.recordWinToServer(product, stake, probability, userInfo.id);
      
      return {
        won: true,
        message: `Congratulations! You won ${product.name}! We've recorded your win and will contact you about shipping.`
      };
    } catch (error) {
      console.error('Failed to record win with existing address:', error);
      
      // Check if error is due to user not found, clear storage and request new registration
      if (error instanceof Error && error.message.includes('User not found')) {
        console.log('🎰 BACKGROUND: User not found on server, clearing local storage');
        await chrome.storage.sync.remove(['userInfo']);
        return {
          won: true,
          message: 'Congratulations! You won! Please provide your shipping information to claim your prize.',
          requiresUserInfo: true
        };
      }
      
      return {
        won: true,
        message: 'You won! There was an issue recording your win. Please contact support.'
      };
    }
  }

  private async recordBetToServer(product: ProductInfo, stake: number, probability: number, won: boolean, userId: string): Promise<void> {
    try {
      const response = await ShopSpinAPI.recordBet({
        userId,
        product: {
          name: product.name,
          price: product.price,
          currency: product.currency,
          url: product.url,
          image: product.image
        },
        stakeAmount: stake,
        probability,
        won
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to record bet');
      }

      console.log(`Bet (${won ? 'WIN' : 'LOSS'}) successfully recorded to server:`, response.data);
    } catch (error) {
      console.error('Error recording bet to server:', error);
      
      // If user not found, throw specific error that can be caught upstream
      if (error instanceof Error && (error.message.includes('User not found') || error.message.includes('404'))) {
        throw new Error('User not found');
      }
      
      throw error;
    }
  }

  private async recordWinToServer(product: ProductInfo, stake: number, probability: number, userId: string): Promise<void> {
    try {
      // Record the winning bet first
      await this.recordBetToServer(product, stake, probability, true, userId);

      // Then record the win details for fulfillment
      const response = await ShopSpinAPI.recordWin({
        userId,
        product: {
          name: product.name,
          price: product.price,
          currency: product.currency,
          url: product.url,
          image: product.image
        },
        stakeAmount: stake,
        probability
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to record win');
      }

      // Also record locally for analytics
      this.recordSpinResult(product, stake, true);
      
      console.log('Win successfully recorded to server:', response.data);
    } catch (error) {
      console.error('Error recording win to server:', error);
      
      // If user not found, throw specific error that can be caught upstream
      if (error instanceof Error && (error.message.includes('User not found') || error.message.includes('404'))) {
        throw new Error('User not found');
      }
      
      throw error;
    }
  }

  private async createPaymentIntent(amount: number, product: ProductInfo) {
    // Get Stripe configuration
    const config = await this.getStripeConfig();
    
    if (!config.apiKey) {
      throw new Error('Stripe not configured');
    }

    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        amount: Math.round(amount * 100).toString(), // Convert to cents
        currency: 'usd',
        'metadata[product_name]': product.name,
        'metadata[product_url]': product.url,
        'metadata[original_price]': product.price.toString()
      })
    });

    if (!response.ok) {
      throw new Error(`Stripe API error: ${response.status}`);
    }

    return await response.json();
  }

  private async getStripeConfig() {
    const stored = await chrome.storage.sync.get(['stripeApiKey']);
    return {
      apiKey: stored.stripeApiKey || process.env.STRIPE_SECRET_KEY
    };
  }

  private async recordSpinResult(product: ProductInfo, stake: number, won: boolean) {
    const history = await chrome.storage.local.get(['spinHistory']);
    const currentHistory = history.spinHistory || [];
    
    currentHistory.push({
      timestamp: Date.now(),
      product: {
        name: product.name,
        price: product.price,
        url: product.url
      },
      stake,
      won,
      savings: won ? stake : 0
    });

    // Keep only last 100 spins
    if (currentHistory.length > 100) {
      currentHistory.splice(0, currentHistory.length - 100);
    }

    await chrome.storage.local.set({ spinHistory: currentHistory });
  }
}

// Initialize background service
new BackgroundService();