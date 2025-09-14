/**
 * Cookie utility functions for secure cookie handling
 */

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number; // in seconds
  expires?: Date;
  path?: string;
  domain?: string;
}

/**
 * Set a cookie with specified options
 * Note: HttpOnly cookies can only be set server-side
 */
export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  if (typeof window === 'undefined') {
    // Server-side: This would typically be handled by server-side code
    // For client-side, we'll use regular cookies with security options
    return;
  }

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.maxAge) {
    const expires = new Date(Date.now() + options.maxAge * 1000);
    cookieString += `; expires=${expires.toUTCString()}`;
  }

  if (options.expires) {
    cookieString += `; expires=${options.expires.toUTCString()}`;
  }

  if (options.path) {
    cookieString += `; path=${options.path}`;
  } else {
    cookieString += '; path=/';
  }

  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }

  if (options.secure) {
    cookieString += '; secure';
  }

  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`;
  }

  // Note: HttpOnly cannot be set via client-side JavaScript
  // It must be set by the server
  
  document.cookie = cookieString;
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const nameEQ = encodeURIComponent(name) + '=';
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
}

/**
 * Remove a cookie by setting its expiration date to the past
 */
export function removeCookie(
  name: string,
  path: string = '/',
  domain?: string
): void {
  if (typeof window === 'undefined') {
    return;
  }

  let cookieString = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;

  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  document.cookie = cookieString;
}

/**
 * Get all cookies as an object
 */
export function getAllCookies(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }

  const cookies: Record<string, string> = {};
  const cookieArray = document.cookie.split(';');

  for (let cookie of cookieArray) {
    cookie = cookie.trim();
    const [name, value] = cookie.split('=');
    if (name && value) {
      cookies[decodeURIComponent(name)] = decodeURIComponent(value);
    }
  }

  return cookies;
}

/**
 * Check if cookies are enabled in the browser
 */
export function areCookiesEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const testCookie = 'test_cookie';
    setCookie(testCookie, 'test_value');
    const isEnabled = getCookie(testCookie) === 'test_value';
    removeCookie(testCookie);
    return isEnabled;
  } catch {
    return false;
  }
}

/**
 * Server-side cookie utilities for Next.js API routes
 */
export class ServerCookies {
  /**
   * Set cookie in server response
   */
  static setCookie(
    response: Response,
    name: string,
    value: string,
    options: CookieOptions = {}
  ): void {
    let cookieString = `${name}=${value}`;

    if (options.maxAge) {
      cookieString += `; Max-Age=${options.maxAge}`;
    }

    if (options.expires) {
      cookieString += `; Expires=${options.expires.toUTCString()}`;
    }

    cookieString += `; Path=${options.path || '/'}`;

    if (options.domain) {
      cookieString += `; Domain=${options.domain}`;
    }

    if (options.secure) {
      cookieString += '; Secure';
    }

    if (options.httpOnly) {
      cookieString += '; HttpOnly';
    }

    if (options.sameSite) {
      cookieString += `; SameSite=${options.sameSite}`;
    }

    response.headers.set('Set-Cookie', cookieString);
  }

  /**
   * Get cookie from server request
   */
  static getCookie(request: Request, name: string): string | null {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(';');
    for (let cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName === name) {
        return cookieValue;
      }
    }

    return null;
  }
}