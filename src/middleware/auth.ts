// Authentication middleware
// Protects routes and validates user sessions
import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  id: string;
  email: string;
  role: string;
  exp: number;
}

// Protected routes configuration
const protectedRoutes = {
  // Routes that require authentication
  authenticated: [
    '/products',
    '/dashboard',
    '/profile',
    '/orders',
    '/cart',
    '/checkout',
  ],
  // Routes that require specific roles
  admin: [
    '/admin',
  ],
  user: [
    '/user',
  ],
  // Routes that should redirect authenticated users
  guest: [
    '/signin',
    '/signup',
  ],
};

/**
 * Get token from request cookies
 */
function getTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get('auth_token')?.value || null;
}

/**
 * Decode and validate JWT token
 */
function validateToken(token: string): DecodedToken | null {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    
    // Check if token is expired
    if (decoded.exp * 1000 < Date.now()) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

/**
 * Check if path matches any of the given patterns
 */
function matchesPath(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    // Handle exact matches
    if (pattern === pathname) return true;
    
    // Handle wildcard patterns (e.g., '/admin/*')
    if (pattern.endsWith('/*')) {
      const basePath = pattern.slice(0, -2);
      return pathname.startsWith(basePath + '/');
    }
    
    // Handle prefix matches
    return pathname.startsWith(pattern);
  });
}

/**
 * Create redirect response with proper headers
 */
function createRedirect(url: string, request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL(url, request.url));
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

/**
 * Main middleware function
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = getTokenFromRequest(request);
  const user = token ? validateToken(token) : null;
  
  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Handle guest-only routes (signin, signup)
  if (matchesPath(pathname, protectedRoutes.guest)) {
    if (user) {
      // Redirect authenticated users away from auth pages
      return createRedirect('/home', request);
    }
    return NextResponse.next();
  }

  // Handle admin-only routes
  if (matchesPath(pathname, protectedRoutes.admin)) {
    if (!user) {
      // Store intended destination for redirect after login
      const response = createRedirect('/signin', request);
      response.cookies.set('redirect_after_login', pathname, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 300, // 5 minutes
      });
      return response;
    }
    
    if (user.role !== 'admin') {
      return createRedirect('/unauthorized', request);
    }
    
    return NextResponse.next();
  }

  // Handle user-only routes
  if (matchesPath(pathname, protectedRoutes.user)) {
    if (!user) {
      const response = createRedirect('/signin', request);
      response.cookies.set('redirect_after_login', pathname, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 300,
      });
      return response;
    }
    
    // Allow any authenticated user
    return NextResponse.next();
  }

  // Handle general authenticated routes
  if (matchesPath(pathname, protectedRoutes.authenticated)) {
    if (!user) {
      const response = createRedirect('/signin', request);
      response.cookies.set('redirect_after_login', pathname, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 300,
      });
      return response;
    }
    
    return NextResponse.next();
  }

  // Handle root path redirect
  if (pathname === '/') {
    if (user) {
      return createRedirect('/home', request);
    } else {
      return createRedirect('/signin', request);
    }
  }

  // Allow all other routes
  return NextResponse.next();
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'
  ],
};