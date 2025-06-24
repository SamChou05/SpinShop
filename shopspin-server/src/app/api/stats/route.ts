import { NextResponse } from 'next/server';
import { prismaDb } from '@/lib/database-prisma';
import { ApiResponse } from '@/lib/types';

export async function GET(): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const stats = await prismaDb.getStatistics();

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}