// Login API middleware
// Forwards authentication requests to external API to hide the real API URL
import { NextRequest, NextResponse } from 'next/server';

interface LoginRequest {
  email: string;
  password: string;
}

// External API base URL (server-side only)
const API_BASE_URL = process.env.API_BASE_URL || 'https://ecommerce.routemisr.com';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Forward request to external API
    const apiResponse = await fetch(`${API_BASE_URL}/api/v1/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json(
        { message: data.message || 'Authentication failed' },
        { status: apiResponse.status }
      );
    }

    // Create response with the data from external API
    const response = NextResponse.json(data);

    // Set HTTP-only cookie if token is provided
    if (data.token) {
      response.cookies.set('auth_token', data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/'
      });
    }

    return response;
  } catch (error) {
    console.error('Login middleware error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}