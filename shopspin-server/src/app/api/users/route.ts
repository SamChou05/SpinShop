import { NextRequest, NextResponse } from 'next/server';
import { prismaDb } from '@/lib/database-prisma';
import { CreateUserRequest, ApiResponse, User } from '@/lib/types';
import { validateEmail, validateName, validateAddress, validatePhone, ValidationError } from '@/lib/validation';
import { userCreationRateLimiter, getClientIP } from '@/lib/rateLimit';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<User>>> {
  console.log('🎰 SERVER: User creation request received');
  try {
    // Rate limiting check
    const clientIP = getClientIP(request);
    if (userCreationRateLimiter.isRateLimited(clientIP)) {
      const resetTime = userCreationRateLimiter.getResetTime(clientIP);
      const remaining = Math.ceil((resetTime - Date.now()) / 1000 / 60); // minutes
      
      return NextResponse.json({
        success: false,
        error: `Rate limit exceeded. Too many registration attempts. Try again in ${remaining} minutes.`
      }, { status: 429 });
    }

    const userData: CreateUserRequest = await request.json();
    console.log('🎰 SERVER: User data:', { email: userData.email, name: userData.name });

    // Validate all input fields
    try {
      validateEmail(userData.email);
      validateName(userData.name);
      validateAddress(userData.address);
      validatePhone(userData.phone);
    } catch (error) {
      if (error instanceof ValidationError) {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 400 });
      }
      throw error;
    }

    // Check if user already exists
    const existingUser = await prismaDb.getUserByEmail(userData.email);
    if (existingUser) {
      return NextResponse.json({
        success: true,
        data: existingUser,
        message: 'User already exists'
      });
    }

    // Create new user
    const newUser = await prismaDb.createUser(userData);

    return NextResponse.json({
      success: true,
      data: newUser,
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<User | null>>> {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const id = searchParams.get('id');

    if (email) {
      const user = await prismaDb.getUserByEmail(email);
      return NextResponse.json({
        success: true,
        data: user
      });
    }

    if (id) {
      const user = await prismaDb.getUserById(id);
      return NextResponse.json({
        success: true,
        data: user
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Either email or id parameter is required'
    }, { status: 400 });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}