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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const response = await fetch(`${baseUrl}/api/v1/auth/signin`, {
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

      // Store token in HttpOnly cookie
      if (data.token) {
        setCookie(this.TOKEN_KEY, data.token, {
          httpOnly: true,
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
      const response = await fetch(`${baseUrl}/api/v1/auth/forgotPasswords`, {
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
      const response = await fetch(`${baseUrl}/api/v1/auth/verifyResetCode`, {
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
      const response = await fetch(`${baseUrl}/api/v1/auth/resetPassword`, {
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
   * Get stored JWT token
   */
  getToken(): string | null {
    return getCookie(this.TOKEN_KEY);
  }

  /**
   * Decode JWT token to extract user information
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
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && this.decodeToken(token) !== null;
  }

  /**
   * Get current user from token
   */
  getCurrentUser(): User | null {
    return this.decodeToken();
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
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;