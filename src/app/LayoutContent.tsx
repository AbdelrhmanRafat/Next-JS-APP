'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getCookie } from '@/utils/cookie';

interface LayoutContentProps {
  children: React.ReactNode;
}

// Routes that require authentication
const protectedRoutes = [
  '/products',
  '/profile',
  '/orders',
  '/cart',
  '/checkout',
  '/home'
];

// Routes that require admin role
const adminRoutes = [
  '/admin'
];

// Routes that should redirect authenticated users (guest-only)
const guestOnlyRoutes = [
  '/signin',
  '/signup'
];

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/about',
  '/contact'
];

export default function LayoutContent({ children }: LayoutContentProps) {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [hasAdminRole, setHasAdminRole] = useState(false);

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check admin role
  useEffect(() => {
    const checkAdminRole = async () => {
      if (user) {
        const isAdmin = await hasRole('admin');
        setHasAdminRole(isAdmin);
      } else {
        setHasAdminRole(false);
      }
    };
    
    checkAdminRole();
  }, [user, hasRole]);

  // Check if current path matches any pattern
  const matchesPath = (path: string, patterns: string[]): boolean => {
    return patterns.some(pattern => {
      if (pattern === path) return true;
      if (pattern.endsWith('/*')) {
        const basePath = pattern.slice(0, -2);
        return path.startsWith(basePath + '/');
      }
      return path.startsWith(pattern);
    });
  };

  // Handle authentication and routing logic
  useEffect(() => {
    if (!isClient || isLoading) return;

    // Handle guest-only routes (signin, signup)
    if (matchesPath(pathname, guestOnlyRoutes)) {
      if (isAuthenticated) {
        // Check for redirect after login cookie
        const redirectPath = getCookie('redirect_after_login');
        if (redirectPath && redirectPath !== '/signin' && redirectPath !== '/signup') {
          // Clear the redirect cookie
          document.cookie = 'redirect_after_login=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          router.push(redirectPath);
        } else {
          router.push('/products');
        }
        return;
      }
      // Allow access to guest-only routes for unauthenticated users
      return;
    }

    // Handle admin-only routes
    if (matchesPath(pathname, adminRoutes)) {
      if (!isAuthenticated) {
        // Store current path for redirect after login
        document.cookie = `redirect_after_login=${pathname}; path=/; max-age=300; SameSite=Strict`;
        router.push('/signin');
        return;
      }
      
      if (!hasAdminRole) {
        router.push('/unauthorized');
        return;
      }
    }

    // Handle protected routes
    if (matchesPath(pathname, protectedRoutes)) {
      if (!isAuthenticated) {
        // Store current path for redirect after login
        document.cookie = `redirect_after_login=${pathname}; path=/; max-age=300; SameSite=Strict`;
        router.push('/signin');
        return;
      }
    }

    // Handle root path
    if (pathname === '/') {
      if (isAuthenticated) {
        router.push('/products');
      } else {
        router.push('/signin');
      }
      return;
    }

    // All other routes (public routes) are allowed
  }, [isClient, isLoading, isAuthenticated, pathname, router, user, hasRole]);

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

  // Show nothing while redirecting for protected routes
  if (isClient && !isLoading) {
    // Don't render content if we're about to redirect
    if (matchesPath(pathname, guestOnlyRoutes) && isAuthenticated) {
      return null;
    }
    
    if (matchesPath(pathname, protectedRoutes) && !isAuthenticated) {
      return null;
    }
    
    if (matchesPath(pathname, adminRoutes) && (!isAuthenticated || !hasAdminRole)) {
      return null;
    }
    
    if (pathname === '/') {
      return null;
    }
  }

  // Render children if all checks pass
  return <>{children}</>;
}