# Stripe Payment Integration Guide

## Overview
The ShopSpin server now includes Stripe payment processing to handle real money transactions for betting stakes.

## Setup Process

### 1. Stripe Account Setup
1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Complete business verification
3. Get your API keys from the Stripe Dashboard

### 2. Environment Variables
Update your `.env.production` file with actual Stripe keys:

```bash
# Replace with your actual Stripe keys
STRIPE_PUBLISHABLE_KEY="pk_live_..." # or pk_test_... for testing
STRIPE_SECRET_KEY="sk_live_..."      # or sk_test_... for testing
STRIPE_WEBHOOK_SECRET="whsec_..."    # Created when setting up webhooks
```

### 3. Webhook Configuration
1. In Stripe Dashboard, go to Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/payments/webhooks`
3. Select events to send:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
4. Copy the webhook secret to your environment variables

### 4. Payment Flow

#### Frontend (Chrome Extension)
```typescript
import { StripeClient } from './lib/stripe-client';

// 1. Create payment intent
const paymentResponse = await StripeClient.createPaymentIntent({
  userId: 'user123',
  stakeAmount: 10.00,
  productPrice: 199.99,
  productName: 'iPhone 15',
  productUrl: 'https://apple.com/iphone-15'
});

// 2. Process payment (redirect to Stripe Checkout or use Elements)
if (paymentResponse.success) {
  await StripeClient.processPayment(paymentResponse.clientSecret!);
}
```

#### Backend Processing
1. **Payment Intent Creation** (`/api/payments/create-intent`)
   - Validates user and stake amount
   - Creates Stripe payment intent
   - Returns client secret for frontend

2. **Webhook Processing** (`/api/payments/webhooks`)
   - Handles `payment_intent.succeeded` events
   - Calculates win/loss based on 3% house edge
   - Records bet in database
   - Logs results

## API Endpoints

### POST `/api/payments/create-intent`
Creates a payment intent for a bet stake.

**Request:**
```json
{
  "userId": "string",
  "stakeAmount": 10.00,
  "productPrice": 199.99,
  "productName": "iPhone 15",
  "productUrl": "https://apple.com/iphone-15"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentIntentId": "pi_xxx"
  }
}
```

### POST `/api/payments/webhooks`
Handles Stripe webhook events.

**Headers:**
- `stripe-signature`: Webhook signature for verification

## Database Schema Updates

The `Bet` model now includes:
```prisma
model Bet {
  // ... existing fields
  paymentIntentId String? // Links bet to Stripe payment
}
```

## Security Features

1. **Webhook Signature Verification**: All webhook events are verified using Stripe's signature
2. **Amount Validation**: Stake amounts are validated against product prices
3. **Rate Limiting**: Payment creation is rate-limited per user
4. **Idempotency**: Duplicate payments are prevented

## Testing

### Test Mode
1. Use Stripe test keys (`pk_test_...` and `sk_test_...`)
2. Use test webhook endpoint
3. Test with Stripe's test card numbers:
   - Success: `4242424242424242`
   - Decline: `4000000000000002`

### Production Mode
1. Switch to live keys (`pk_live_...` and `sk_live_...`)
2. Update webhook endpoint to production URL
3. Test with real (small) amounts

## Current Limitations

1. **Payout System**: Winnings are logged but not automatically paid out
2. **Chrome Extension Integration**: Full payment UI needs implementation
3. **Compliance**: Additional compliance features may be needed based on jurisdiction

## Next Steps

1. Implement payout system for winners
2. Add Chrome extension payment UI
3. Add transaction history for users
4. Implement refund system for failed bets
5. Add compliance features (age verification, etc.)

## Troubleshooting

### Common Issues
1. **Webhook not receiving events**: Check endpoint URL and SSL certificate
2. **Payment fails**: Verify test card numbers and Stripe keys
3. **Signature verification fails**: Ensure webhook secret is correct

### Logs
- Payment intents: Look for `💳 PAYMENT INTENT CREATED` logs
- Webhooks: Look for `💳 WEBHOOK:` logs
- Bet results: Look for `🎰 WIN/LOSS` logs