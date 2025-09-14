// Signup API middleware
// Forwards signup requests to external API to hide the real API URL
import { NextRequest, NextResponse } from 'next/server';

interface SignupRequest {
  name: string;
  email: string;
  password: string;
  rePassword: string;
  phone: string;
}

// External API base URL (server-side only)
const API_BASE_URL = process.env.API_BASE_URL || 'https://ecommerce.routemisr.com';

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json();
    const { name, email, password, rePassword, phone } = body;

    // Validate input
    if (!name || !email || !password || !rePassword || !phone) {
      return NextResponse.json(
        { message: 'All fields are required (name, email, password, rePassword, phone)' },
        { status: 400 }
      );
    }

    // Validate password match
    if (password !== rePassword) {
      return NextResponse.json(
        { message: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Forward request to external API
    const apiResponse = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password, rePassword, phone }),
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json(
        { message: data.message || 'Signup failed' },
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
    console.error('Signup middleware error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}