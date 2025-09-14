'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import authService, { User, SignInData, SignUpData } from '@/services/api/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: SignInData) => Promise<void>;
  signup: (userData: SignUpData) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  hasRole: (role: string) => Promise<boolean>;
  hasAnyRole: (roles: string[]) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Get user data from server-side API
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Auth initialization error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: SignInData): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.signIn(credentials);
      
      // Get user data from server-side API
      const userData = await authService.getCurrentUser();
      setUser(userData);
      
      // Redirect to products or intended page
      router.push('/products');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: SignUpData): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.signUp(userData);
      
      // Redirect to sign in page after successful signup
      router.push('/signin');
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    try {
      authService.logout();
      setUser(null);
      router.push('/signin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUserData = async (): Promise<void> => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Refresh user data error:', error);
      setUser(null);
    }
  };

  const hasRole = async (role: string): Promise<boolean> => {
    return await authService.hasRole(role);
  };

  const hasAnyRole = async (roles: string[]): Promise<boolean> => {
    return await authService.hasAnyRole(roles);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    refreshUserData,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// HOC for protecting components
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/signin');
      }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}

// HOC for role-based access
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles: string[]
) {
  return function RoleProtectedComponent(props: P) {
    const { hasAnyRole, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading) {
        if (!isAuthenticated) {
          router.push('/signin');
        } else if (!hasAnyRole(requiredRoles)) {
          router.push('/unauthorized');
        }
      }
    }, [isAuthenticated, isLoading, hasAnyRole, router]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated || !hasAnyRole(requiredRoles)) {
      return null;
    }

    return <Component {...props} />;
  };
}