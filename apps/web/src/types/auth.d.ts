// Type definitions for authentication module
export interface DecodedToken {
  /** User ID (subject) */
  sub: string;
  /** Token issued at timestamp */
  iat?: number;
  /** Token expiration timestamp */
  exp?: number;
}

/**
 * Extracts user information from a JWT token
 * @param token The JWT token to decode
 * @returns The decoded token information or null if invalid
 */
export function getUserFromToken(token: string): DecodedToken | null; 