// Reset Password API middleware
// Forwards password reset requests to external API to hide the real API URL
import { NextRequest, NextResponse } from 'next/server';

interface ResetPasswordRequest {
  email: string;
  resetCode: string;
  newPassword: string;
}

// External API base URL (server-side only)
const API_BASE_URL = process.env.API_BASE_URL || 'https://ecommerce.routemisr.com';

export async function PUT(request: NextRequest) {
  try {
    const body: ResetPasswordRequest = await request.json();
    const { email, resetCode, newPassword } = body;

    // Validate input
    if (!email || !resetCode || !newPassword) {
      return NextResponse.json(
        { message: 'Email, reset code, and new password are required' },
        { status: 400 }
      );
    }

    // Forward request to external API
    const apiResponse = await fetch(`${API_BASE_URL}/api/v1/auth/resetPassword`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, resetCode, newPassword }),
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json(
        { message: data.message || 'Password reset failed' },
        { status: apiResponse.status }
      );
    }

    // Return response from external API
    return NextResponse.json(data);
  } catch (error) {
    console.error('Reset password middleware error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}