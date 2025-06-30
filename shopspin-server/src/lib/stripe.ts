import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export interface PaymentIntentRequest {
  amount: number; // in cents
  currency: string;
  metadata?: Record<string, string>;
}

export interface PaymentMethodRequest {
  customerId: string;
  paymentMethodId: string;
}

export class StripeService {
  /**
   * Create a payment intent for a stake amount
   */
  static async createPaymentIntent(params: PaymentIntentRequest): Promise<Stripe.PaymentIntent> {
    return await stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency,
      metadata: params.metadata || {},
      payment_method_types: ['card'],
    });
  }

  /**
   * Create a customer for storing payment methods
   */
  static async createCustomer(email: string, name: string): Promise<Stripe.Customer> {
    return await stripe.customers.create({
      email,
      name,
    });
  }

  /**
   * Retrieve a payment intent
   */
  static async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  }

  /**
   * Confirm a payment intent
   */
  static async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<Stripe.PaymentIntent> {
    return await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });
  }

  /**
   * Create a payout for winnings (requires Stripe Connect)
   */
  static async createPayout(amount: number, destination: string): Promise<Stripe.Transfer> {
    return await stripe.transfers.create({
      amount,
      currency: 'usd',
      destination,
    });
  }

  /**
   * Construct webhook event
   */
  static constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    endpointSecret: string
  ): Stripe.Event {
    return stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  }
}

export { stripe };
export const stripeService = StripeService;
export default StripeService;