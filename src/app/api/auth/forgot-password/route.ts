// Forgot Password API middleware
// Forwards password reset requests to external API to hide the real API URL
import { NextRequest, NextResponse } from 'next/server';

interface ForgotPasswordRequest {
  email: string;
}

// External API base URL (server-side only)
const API_BASE_URL = process.env.API_BASE_URL || 'https://ecommerce.routemisr.com';

export async function POST(request: NextRequest) {
  try {
    const body: ForgotPasswordRequest = await request.json();
    const { email } = body;

    // Validate input
    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // Forward request to external API
    const apiResponse = await fetch(`${API_BASE_URL}/api/v1/auth/forgotPasswords`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json(
        { message: data.message || 'Password reset request failed' },
        { status: apiResponse.status }
      );
    }

    // Return response from external API
    return NextResponse.json(data);
  } catch (error) {
    console.error('Forgot password middleware error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}