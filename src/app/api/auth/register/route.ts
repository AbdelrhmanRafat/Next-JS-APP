// Register API middleware
// Forwards registration requests to external API to hide the real API URL
import { NextRequest, NextResponse } from 'next/server';

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// External API base URL (server-side only)
const API_BASE_URL = process.env.API_BASE_URL || 'https://ecommerce.routemisr.com';

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    const { name, email, password } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Forward request to external API
    const apiResponse = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json(
        { message: data.message || 'Registration failed' },
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
    console.error('Registration middleware error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}