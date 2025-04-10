// src/utils/auth.ts
import { jwtDecode } from 'jwt-decode'; // Use jwt-decode library

interface DecodedToken {
  sub: string; // User ID (subject)
  // Add other expected claims like iat, exp if needed
  iat?: number;
  exp?: number;
}

export const getUserFromToken = (token: string): DecodedToken | null => {
  if (!token) {
    return null;
  }
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    // Optional: Check expiry if needed (client-side check isn't secure validation)
    // const now = Date.now() / 1000;
    // if (decoded.exp && decoded.exp < now) {
    //   console.warn('Token expired');
    //   return null;
    // }
    return decoded;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};