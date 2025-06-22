import { ProductInfo } from '../content/productDetector';


interface SpinResult {
  won: boolean;
  message: string;
  paymentIntentId?: string;
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

  private async handleSpinRequest(product: ProductInfo, stake: number): Promise<SpinResult> {
    // Validate stake
    if (stake <= 0 || stake > product.price) {
      return {
        won: false,
        message: 'Invalid stake amount'
      };
    }

    // Calculate probability
    const probability = Math.min(stake / product.price, 1);
    
    // Generate secure random number using crypto API
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    const randomValue = randomArray[0] / (0xFFFFFFFF + 1); // Convert to 0-1 range

    const won = randomValue < probability;

    if (won) {
      // User won! Create payment intent for the remaining amount
      const remainingAmount = product.price - stake;
      
      try {
        const paymentIntent = await this.createPaymentIntent(remainingAmount, product);
        
        return {
          won: true,
          message: `Congratulations! Pay $${remainingAmount.toFixed(2)} to complete your purchase.`,
          paymentIntentId: paymentIntent.id
        };
      } catch (error) {
        console.error('Payment intent creation failed:', error);
        return {
          won: true,
          message: 'You won, but there was an error processing payment. Please try again.'
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