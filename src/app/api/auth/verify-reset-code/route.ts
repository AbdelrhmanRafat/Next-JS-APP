// Verify Reset Code API middleware
// Forwards reset code verification requests to external API to hide the real API URL
import { NextRequest, NextResponse } from 'next/server';

interface VerifyResetCodeRequest {
  resetCode: string;
}

// External API base URL (server-side only)
const API_BASE_URL = process.env.API_BASE_URL || 'https://ecommerce.routemisr.com';

export async function POST(request: NextRequest) {
  try {
    const body: VerifyResetCodeRequest = await request.json();
    const { resetCode } = body;

    // Validate input
    if (!resetCode) {
      return NextResponse.json(
        { message: 'Reset code is required' },
        { status: 400 }
      );
    }

    // Forward request to external API
    const apiResponse = await fetch(`${API_BASE_URL}/api/v1/auth/verifyResetCode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resetCode }),
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      return NextResponse.json(
        { message: data.message || 'Reset code verification failed' },
        { status: apiResponse.status }
      );
    }

    // Return response from external API
    return NextResponse.json(data);
  } catch (error) {
    console.error('Verify reset code middleware error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}