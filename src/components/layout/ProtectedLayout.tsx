'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getCookie } from '@/utils/cookie';

interface ProtectedLayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
  redirectTo?: string;
}

export default function ProtectedLayout({
  children,
  requireAuth = true,
  allowedRoles = [],
  redirectTo = '/signin'
}: ProtectedLayoutProps) {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle authentication checks
  useEffect(() => {
    if (!isClient || isLoading) return;

    // If authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      // Store current path for redirect after login
      const currentPath = window.location.pathname;
      if (currentPath !== '/signin' && currentPath !== '/signup') {
        document.cookie = `redirect_after_login=${currentPath}; path=/; max-age=300; SameSite=Strict`;
      }
      router.push(redirectTo);
      return;
    }

    // If user is authenticated but accessing guest-only routes
    if (!requireAuth && isAuthenticated) {
      const currentPath = window.location.pathname;
      if (currentPath === '/signin' || currentPath === '/signup') {
        router.push('/home');
        return;
      }
    }

    // Check role-based access
    if (requireAuth && isAuthenticated && allowedRoles.length > 0) {
      const hasRequiredRole = allowedRoles.some(role => hasRole(role));
      if (!hasRequiredRole) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [isClient, isLoading, isAuthenticated, user, requireAuth, allowedRoles, redirectTo, router, hasRole]);

  // Show loading state during authentication check
  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // Show nothing while checking roles
  if (requireAuth && isAuthenticated && allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.some(role => hasRole(role));
    if (!hasRequiredRole) {
      return null;
    }
  }

  // Render children if all checks pass
  return <>{children}</>;
}

// Higher-order component for easy page protection
export function withProtectedLayout<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedLayoutProps, 'children'> = {}
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedLayout {...options}>
        <Component {...props} />
      </ProtectedLayout>
    );
  };
}

// Server-side authentication check utility
export async function getServerSideAuth(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  // Parse cookies manually for server-side
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const token = cookies['auth_token'];
  if (!token) return null;

  try {
    // Import jwtDecode dynamically to avoid SSR issues
    const { jwtDecode } = await import('jwt-decode');
    const decoded = jwtDecode<{
      id: string;
      email: string;
      role: string;
      exp: number;
    }>(token);

    // Check if token is expired
    if (decoded.exp * 1000 < Date.now()) {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Server-side token validation error:', error);
    return null;
  }
}