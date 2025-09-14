import { getCookie } from './cookie';

/**
 * HTTP request configuration
 */
export interface HttpConfig extends RequestInit {
  baseURL?: string;
  timeout?: number;
  withAuth?: boolean;
}

/**
 * HTTP response wrapper
 */
export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

/**
 * HTTP error class
 */
export class HttpError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any,
    message?: string
  ) {
    super(message || `HTTP Error ${status}: ${statusText}`);
    this.name = 'HttpError';
  }
}

/**
 * Loading state management
 */
class LoadingManager {
  private loadingRequests = new Set<string>();
  private listeners: Array<(isLoading: boolean) => void> = [];

  addRequest(id: string): void {
    this.loadingRequests.add(id);
    this.notifyListeners();
  }

  removeRequest(id: string): void {
    this.loadingRequests.delete(id);
    this.notifyListeners();
  }

  isLoading(): boolean {
    return this.loadingRequests.size > 0;
  }

  subscribe(listener: (isLoading: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    const isLoading = this.isLoading();
    this.listeners.forEach(listener => listener(isLoading));
  }
}

export const loadingManager = new LoadingManager();

/**
 * HTTP client class
 */
class HttpClient {
  private baseURL: string;
  private defaultConfig: HttpConfig;

  constructor(baseURL: string = '', defaultConfig: HttpConfig = {}) {
    this.baseURL = baseURL;
    this.defaultConfig = {
      timeout: 10000,
      withAuth: true,
      ...defaultConfig,
    };
  }

  /**
   * Create request with authentication and error handling
   */
  private async request<T>(
    url: string,
    config: HttpConfig = {}
  ): Promise<HttpResponse<T>> {
    const requestId = Math.random().toString(36).substr(2, 9);
    
    try {
      // Start loading
      loadingManager.addRequest(requestId);

      // Merge configurations
      const mergedConfig: HttpConfig = {
        ...this.defaultConfig,
        ...config,
        headers: {
          'Content-Type': 'application/json',
          ...this.defaultConfig.headers,
          ...config.headers,
        },
      };

      // Add authentication header if required
      if (mergedConfig.withAuth !== false) {
        const token = getCookie('auth_token');
        if (token) {
          (mergedConfig.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }
      }

      // Build full URL
      const fullUrl = url.startsWith('http') 
        ? url 
        : `${mergedConfig.baseURL || this.baseURL}${url}`;

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, mergedConfig.timeout || 10000);

      // Make request
      const response = await fetch(fullUrl, {
        ...mergedConfig,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle response
      let data: T;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = (await response.text()) as unknown as T;
      }

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          this.handleAuthError();
        }
        
        throw new HttpError(
          response.status,
          response.statusText,
          data,
          (data as any)?.message || `Request failed with status ${response.status}`
        );
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new HttpError(408, 'Request Timeout', null, 'Request timed out');
        }
        throw new HttpError(0, 'Network Error', null, error.message);
      }
      
      throw new HttpError(0, 'Unknown Error', null, 'An unknown error occurred');
    } finally {
      // Stop loading
      loadingManager.removeRequest(requestId);
    }
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(): void {
    // Remove invalid token
    if (typeof window !== 'undefined') {
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      
      // Redirect to sign in page
      window.location.href = '/signin';
    }
  }

  /**
   * GET request
   */
  async get<T>(url: string, config?: HttpConfig): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(
    url: string,
    data?: any,
    config?: HttpConfig
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    url: string,
    data?: any,
    config?: HttpConfig
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    url: string,
    data?: any,
    config?: HttpConfig
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: HttpConfig): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }
}

// Create default HTTP client instance
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
export const httpClient = new HttpClient(baseURL);

// Export convenience methods
export const { get, post, put, patch, delete: del } = httpClient;

// Export class for custom instances
export { HttpClient };

// React hook for loading state
export function useLoading(): boolean {
  if (typeof window === 'undefined') return false;
  
  const [isLoading, setIsLoading] = React.useState(loadingManager.isLoading());
  
  React.useEffect(() => {
    const unsubscribe = loadingManager.subscribe(setIsLoading);
    return unsubscribe;
  }, []);
  
  return isLoading;
}

// Add React import for the hook
import React from 'react';