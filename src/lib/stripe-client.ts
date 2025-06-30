import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    // This will be replaced with actual publishable key
    const publishableKey = 'pk_test_...'; // Replace with your actual publishable key
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

export interface PaymentRequest {
  userId: string;
  stakeAmount: number;
  productPrice: number;
  productName: string;
  productUrl: string;
}

export interface PaymentResponse {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  error?: string;
}

export class StripeClient {
  private static serverUrl = 'http://localhost:3000'; // Will be updated to production URL

  /**
   * Create a payment intent and return client secret
   */
  static async createPaymentIntent(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.serverUrl}/api/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentRequest),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to create payment intent'
        };
      }

      return {
        success: true,
        clientSecret: data.data.clientSecret,
        paymentIntentId: data.data.paymentIntentId,
      };

    } catch (error) {
      console.error('Error creating payment intent:', error);
      return {
        success: false,
        error: 'Network error'
      };
    }
  }

  /**
   * Process payment with Stripe
   */
  static async processPayment(clientSecret: string): Promise<{ success: boolean; error?: string }> {
    try {
      const stripe = await getStripe();
      if (!stripe) {
        return { success: false, error: 'Stripe not loaded' };
      }

      // In a real Chrome extension, you'd open a popup or redirect to Stripe Checkout
      // For now, this is a placeholder for the payment processing
      console.log('💳 Processing payment with client secret:', clientSecret);
      
      // This would be replaced by actual Stripe payment processing
      // For example: stripe.confirmCardPayment() or stripe.redirectToCheckout()
      
      return { success: true };

    } catch (error) {
      console.error('Error processing payment:', error);
      return { success: false, error: 'Payment processing failed' };
    }
  }

  /**
   * Set the server URL (for switching between development and production)
   */
  static setServerUrl(url: string): void {
    this.serverUrl = url;
  }
}

export default StripeClient;