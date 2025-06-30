import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '../../../../lib/stripe';
import { prismaDb } from '../../../../lib/database-prisma';
import Stripe from 'stripe';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('💳 WEBHOOK ERROR: STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('💳 WEBHOOK ERROR: Missing stripe-signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = StripeService.constructWebhookEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('💳 WEBHOOK ERROR: Invalid signature:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`💳 WEBHOOK: Received ${event.type} event`);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.canceled':
        console.log(`💳 WEBHOOK: Payment canceled: ${event.data.object.id}`);
        break;
      default:
        console.log(`💳 WEBHOOK: Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('💳 WEBHOOK ERROR:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const metadata = paymentIntent.metadata;
    const { userId, productName, productUrl, productPrice, stakeAmount, userEmail } = metadata;

    console.log(`💳 PAYMENT SUCCEEDED: $${stakeAmount} from ${userEmail} for ${productName}`);

    // Calculate win probability (3% house edge)
    const rawProbability = parseFloat(stakeAmount) / parseFloat(productPrice);
    const HOUSE_EDGE_MULTIPLIER = 0.97;
    const MAX_WIN_PROBABILITY = 0.95;
    const probability = Math.min(rawProbability * HOUSE_EDGE_MULTIPLIER, MAX_WIN_PROBABILITY);

    // Determine if user wins
    const won = Math.random() < probability;

    // Record the bet
    const bet = await prismaDb.createBet({
      userId,
      product: {
        name: productName,
        price: parseFloat(productPrice),
        url: productUrl,
        imageUrl: '', // We don't have this from the webhook
      },
      stakeAmount: parseFloat(stakeAmount),
      probability,
      won,
      betTimestamp: new Date(),
      paymentIntentId: paymentIntent.id,
    });

    const resultText = won ? 'WIN' : 'LOSS';
    console.log(`🎰 ${resultText}! Bet ID: ${bet.id}, User: ${userEmail}, Stake: $${stakeAmount}`);

    // TODO: If won, we should initiate payout process or store win for manual processing
    if (won) {
      console.log(`🏆 USER WON: ${userEmail} won ${productName} worth $${productPrice}!`);
      // In a real system, you'd create a payout or store the win for fulfillment
    }

  } catch (error) {
    console.error('💳 ERROR handling payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const metadata = paymentIntent.metadata;
    const { userEmail, stakeAmount, productName } = metadata;

    console.log(`💳 PAYMENT FAILED: $${stakeAmount} from ${userEmail} for ${productName}`);
    
    // Could log this failure or notify the user
    
  } catch (error) {
    console.error('💳 ERROR handling payment failure:', error);
  }
}