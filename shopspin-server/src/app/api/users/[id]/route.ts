import { NextRequest, NextResponse } from 'next/server';
import { prismaDb } from '../../../../lib/database-prisma';
import { ApiResponse, User } from '../../../../lib/types';
import { validateEmail, validateName, validateAddress, validatePhone, ValidationError } from '../../../../lib/validation';

// Update user profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<User>>> {
  try {
    const { id } = await params;
    const updateData = await request.json();

    // Validate user exists
    const existingUser = await prismaDb.getUserById(id);
    if (!existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Validate updated fields
    try {
      if (updateData.email !== undefined) {
        validateEmail(updateData.email);
        
        // Check if email is already taken by another user
        const emailUser = await prismaDb.getUserByEmail(updateData.email);
        if (emailUser && emailUser.id !== id) {
          return NextResponse.json({
            success: false,
            error: 'Email is already in use by another user'
          }, { status: 400 });
        }
      }
      
      if (updateData.name !== undefined) {
        validateName(updateData.name);
      }
      
      if (updateData.address !== undefined) {
        validateAddress(updateData.address);
      }
      
      if (updateData.phone !== undefined) {
        validatePhone(updateData.phone);
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

    // Update user
    const updatedUser = await prismaDb.updateUser(id, updateData);
    
    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update user'
      }, { status: 500 });
    }

    console.log(`🎰 USER UPDATED: ${updatedUser.email}`);

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Delete user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;
    
    // This would need admin authentication in production
    const user = await prismaDb.getUserById(id);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Note: In a real implementation, you'd want to handle cascade deletes
    // for user's bets and wins, or mark as soft-deleted
    
    return NextResponse.json({
      success: true,
      message: 'User deletion would be implemented here'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}