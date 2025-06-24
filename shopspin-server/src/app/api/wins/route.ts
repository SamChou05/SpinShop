import { NextRequest, NextResponse } from 'next/server';
import { prismaDb } from '@/lib/database-prisma';
import { RecordWinRequest, ApiResponse, Win } from '@/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Win>>> {
  console.log('🎰 SERVER: Win recording request received');
  try {
    const winData: RecordWinRequest = await request.json();
    console.log('🎰 SERVER: Win data:', { userId: winData.userId, productName: winData.product?.name, stake: winData.stakeAmount });

    // Validate required fields
    if (!winData.userId || !winData.product || !winData.stakeAmount || !winData.probability) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: userId, product, stakeAmount, and probability are required'
      }, { status: 400 });
    }

    // Verify user exists
    const user = await prismaDb.getUserById(winData.userId);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Create win record
    const newWin = await prismaDb.createWin({
      userId: winData.userId,
      product: winData.product,
      stakeAmount: winData.stakeAmount,
      probability: winData.probability,
      winTimestamp: new Date(),
      status: 'pending'
    });

    console.log(`🎰 NEW WIN RECORDED! User: ${user.email}, Product: ${winData.product.name}, Stake: $${winData.stakeAmount}`);

    return NextResponse.json({
      success: true,
      data: newWin,
      message: 'Win recorded successfully'
    });

  } catch (error) {
    console.error('Error recording win:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Win[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      const wins = await prismaDb.getWinsByUserId(userId);
      return NextResponse.json({
        success: true,
        data: wins
      });
    }

    // Get all wins for admin dashboard
    const allWins = await prismaDb.getAllWins();
    return NextResponse.json({
      success: true,
      data: allWins
    });

  } catch (error) {
    console.error('Error fetching wins:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}