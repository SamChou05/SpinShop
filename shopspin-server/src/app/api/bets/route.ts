import { NextRequest, NextResponse } from 'next/server';
import { prismaDb } from '../../../lib/database-prisma';
import { ApiResponse, RecordBetRequest } from '../../../lib/types';
import { validateStakeAmount, validateProduct, validateProbability, ValidationError } from '../../../lib/validation';
import { betRateLimiter, getClientIP } from '../../../lib/rateLimit';

// Record a new bet (win or loss)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Rate limiting check
    const clientIP = getClientIP(request);
    if (betRateLimiter.isRateLimited(clientIP)) {
      const resetTime = betRateLimiter.getResetTime(clientIP);
      const remaining = Math.ceil((resetTime - Date.now()) / 1000 / 60); // minutes
      
      return NextResponse.json({
        success: false,
        error: `Rate limit exceeded. Too many bets. Try again in ${remaining} minutes.`
      }, { status: 429 });
    }

    const betData: RecordBetRequest = await request.json();
    console.log('🎰 SERVER: Bet recording request received');
    console.log('🎰 SERVER: Bet data:', {
      userId: betData.userId,
      productName: betData.product.name,
      stake: betData.stakeAmount,
      won: betData.won,
      probability: betData.probability
    });

    // Validate all input fields
    try {
      if (!betData.userId || typeof betData.userId !== 'string') {
        throw new ValidationError('User ID is required');
      }
      
      validateProduct(betData.product);
      validateStakeAmount(betData.stakeAmount, betData.product.price);
      validateProbability(betData.probability);
      
      if (typeof betData.won !== 'boolean') {
        throw new ValidationError('Won status must be a boolean');
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

    // Verify user exists
    const user = await prismaDb.getUserById(betData.userId);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Create bet record
    const bet = await prismaDb.createBet({
      userId: betData.userId,
      product: betData.product,
      stakeAmount: betData.stakeAmount,
      probability: betData.probability,
      won: betData.won,
      betTimestamp: new Date()
    });

    const resultText = betData.won ? 'WIN' : 'LOSS';
    console.log(`🎰 ${resultText} RECORDED! User: ${user.email}, Product: ${betData.product.name}, Stake: $${betData.stakeAmount}, Won: ${betData.won}`);

    return NextResponse.json({
      success: true,
      data: bet,
      message: `Bet recorded successfully`
    });

  } catch (error) {
    console.error('🎰 SERVER: Error recording bet:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Get all bets
export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    const bets = await prismaDb.getAllBets();
    
    return NextResponse.json({
      success: true,
      data: bets
    });
  } catch (error) {
    console.error('🎰 SERVER: Error fetching bets:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}