import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '../../../../lib/stripe';
import { prismaDb } from '../../../../lib/database-prisma';
import { ApiResponse } from '../../../../lib/types';
import { validateStakeAmount, ValidationError } from '../../../../lib/validation';

export interface CreatePaymentIntentRequest {
  amount: number;
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Stripe not configured'
      }, { status: 500 });
    }

    const { amount }: CreatePaymentIntentRequest = await request.json();

    // Validate input
    try {
      if (typeof amount !== 'number' || amount <= 0) {
        throw new ValidationError('Valid amount is required');
      }
      if (amount < 0.01) {
        throw new ValidationError('Minimum amount is $0.01');
      }
      if (amount > 10000) {
        throw new ValidationError('Maximum amount is $10,000');
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 400 });
      }
      throw error;
    }

    // Create payment intent
    const paymentIntent = await StripeService.createPaymentIntent({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        stakeAmount: amount.toString(),
      }
    });

    console.log(`💳 PAYMENT INTENT CREATED: $${amount}`);

    return NextResponse.json({
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    });

  } catch (error) {
    console.error('💳 ERROR: Creating payment intent:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create payment intent'
    }, { status: 500 });
  }
}