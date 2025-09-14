// Authentication service
// API calls for login, register, logout, and session management
import { jwtDecode } from 'jwt-decode';
import { getCookie, setCookie, removeCookie } from '@/utils/cookie';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ecommerce.routemisr.com';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export interface SignUpData {
  name: string;
  email: string;
  password: string;
  rePassword: string;
  phone: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  email: string;
  resetCode: string;
  newPassword: string;
}

class AuthService {
  private readonly TOKEN_KEY = 'auth_token';

  /**
   * Sign up a new user
   */
  async signUp(userData: SignUpData): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Sign up failed');
      }

      return data;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  /**
   * Sign in user and store JWT token in HttpOnly cookie
   */
  async signIn(credentials: SignInData): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Sign in failed');
      }

      // Store token in secure cookie
      if (data.token) {
        setCookie(this.TOKEN_KEY, data.token, {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60, // 7 days
        });
      }

      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async forgetPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset request failed');
      }

      return data;
    } catch (error) {
      console.error('Forget password error:', error);
      throw error;
    }
  }

  /**
   * Verify reset code
   */
  async verifyResetCode(code: string): Promise<{ message: string; isValid: boolean }> {
    try {
      const response = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resetCode: code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Reset code verification failed');
      }

      return data;
    } catch (error) {
      console.error('Verify reset code error:', error);
      throw error;
    }
  }

  /**
   * Reset password with verified code
   */
  async resetPassword(resetData: ResetPasswordData): Promise<{ message: string }> {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resetData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      return data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Get JWT token from cookie (server-side only)
   */
  getToken(): string | null {
    return getCookie(this.TOKEN_KEY);
  }

  /**
   * Get current user from server-side API
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.authenticated ? data.user : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated (server-side API call)
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.authenticated;
    } catch (error) {
      console.error('Authentication check error:', error);
      return false;
    }
  }

  /**
   * Decode JWT token to extract user information (for server-side use)
   */
  decodeToken(token?: string): User | null {
    try {
      const authToken = token || this.getToken();
      if (!authToken) return null;

      const decoded = jwtDecode<User & { exp: number }>(authToken);
      
      // Check if token is expired
      if (decoded.exp * 1000 < Date.now()) {
        this.logout();
        return null;
      }

      return {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (error) {
      console.error('Token decode error:', error);
      this.logout();
      return null;
    }
  }

  /**
   * Logout user and remove token
   */
  logout(): void {
    removeCookie(this.TOKEN_KEY);
  }

  /**
   * Check if user has specific role
   */
  async hasRole(role: string): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  async hasAnyRole(roles: string[]): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;