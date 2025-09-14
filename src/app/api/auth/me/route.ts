// Authentication status API endpoint
// Returns current user information if authenticated
import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  id: string;
  email: string;
  name: string;
  role: string;
  exp: number;
}

export async function GET(request: NextRequest) {
  try {
    // Get token from HTTP-only cookie
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }

    // Decode and validate token
    const decoded = jwtDecode<DecodedToken>(token);
    
    // Check if token is expired
    if (decoded.exp * 1000 < Date.now()) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }

    // Return user information
    return NextResponse.json({
      authenticated: true,
      user: {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
      },
    });
  } catch (error) {
    console.error('Auth status check error:', error);
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 401 }
    );
  }
}