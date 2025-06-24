import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prismaDb } from '../../../lib/database-prisma';
import { ApiResponse } from '../../../lib/types';

// Reset all data (for development/testing)
export async function POST(_request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('admin_auth');
    
    if (authCookie?.value !== 'authenticated') {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    await prismaDb.reset();
    
    console.log('🎰 DATABASE: All data has been reset');
    
    return NextResponse.json({
      success: true,
      message: 'All data cleared successfully'
    });
  } catch (error) {
    console.error('🎰 SERVER: Error resetting data:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}