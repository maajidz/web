// src/utils/auth.ts
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  sub: string; // User ID (subject)
  iat?: number;
  exp?: number;
}

/**
 * Decodes a JWT token using external library with fallback
 */
function decodeJwtToken<T>(token: string): T {
  try {
    // First try to use the imported jwt-decode
    return jwtDecode<T>(token);
  } catch (importError) {
    console.warn('Failed to use jwt-decode package, using fallback implementation:', importError);
    
    // Fallback implementation if jwt-decode fails
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).split('').map((c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')
      );
      return JSON.parse(jsonPayload);
    } catch (fallbackError) {
      console.error('Fallback JWT decoding also failed:', fallbackError);
      throw fallbackError;
    }
  }
}

/**
 * Gets user information from a JWT token
 */
export const getUserFromToken = (token: string): DecodedToken | null => {
  if (!token) {
    return null;
  }
  
  try {
    const decoded = decodeJwtToken<DecodedToken>(token);
    
    // Validate token expiration
    if (decoded.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp < now) {
        console.warn('Token is expired');
        return null;
      }
    }
    
    return decoded;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};