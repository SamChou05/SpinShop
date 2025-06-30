import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '../../../../lib/stripe';
import { prismaDb } from '../../../../lib/database-prisma';
import { ApiResponse } from '../../../../lib/types';
import { validateStakeAmount, ValidationError } from '../../../../lib/validation';

export interface CreatePaymentIntentRequest {
  userId: string;
  stakeAmount: number;
  productPrice: number;
  productName: string;
  productUrl: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Stripe not configured'
      }, { status: 500 });
    }

    const { userId, stakeAmount, productPrice, productName, productUrl }: CreatePaymentIntentRequest = await request.json();

    // Validate input
    try {
      if (!userId || typeof userId !== 'string') {
        throw new ValidationError('User ID is required');
      }
      validateStakeAmount(stakeAmount, productPrice);
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 400 });
      }
      throw error;
    }

    // Verify user exists
    const user = await prismaDb.getUserById(userId);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Create payment intent
    const paymentIntent = await StripeService.createPaymentIntent({
      amount: Math.round(stakeAmount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId,
        productName,
        productUrl,
        productPrice: productPrice.toString(),
        stakeAmount: stakeAmount.toString(),
        userEmail: user.email,
      }
    });

    console.log(`💳 PAYMENT INTENT CREATED: $${stakeAmount} for ${user.email} on ${productName}`);

    return NextResponse.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }
    });

  } catch (error) {
    console.error('💳 ERROR: Creating payment intent:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create payment intent'
    }, { status: 500 });
  }
}