import { NextRequest, NextResponse } from 'next/server';
import { prismaDb } from '@/lib/database-prisma';
import { UpdateWinStatusRequest, ApiResponse, Win } from '@/lib/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Win>>> {
  try {
    const { id } = await params;
    const updateData: Partial<UpdateWinStatusRequest> = await request.json();

    // Get existing win
    const existingWin = await prismaDb.getWinById(id);
    if (!existingWin) {
      return NextResponse.json({
        success: false,
        error: 'Win not found'
      }, { status: 404 });
    }

    // Update win with new data
    const updatedWin = await prismaDb.updateWin(id, {
      status: updateData.status || existingWin.status,
      orderDetails: updateData.orderDetails ? {
        ...existingWin.orderDetails,
        ...updateData.orderDetails
      } : existingWin.orderDetails
    });

    if (!updatedWin) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update win'
      }, { status: 500 });
    }

    console.log(`🎰 WIN UPDATED! ID: ${id}, Status: ${updatedWin.status}`);

    return NextResponse.json({
      success: true,
      data: updatedWin,
      message: 'Win status updated successfully'
    });

  } catch (error) {
    console.error('Error updating win:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Win>>> {
  try {
    const { id } = await params;
    const win = await prismaDb.getWinById(id);

    if (!win) {
      return NextResponse.json({
        success: false,
        error: 'Win not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: win
    });

  } catch (error) {
    console.error('Error fetching win:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}