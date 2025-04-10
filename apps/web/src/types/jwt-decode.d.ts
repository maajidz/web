declare module 'jwt-decode' {
  /**
   * Decodes a JWT token
   * @param token The JWT string to decode
   * @param options The options to be used during decode
   * @returns The decoded token
   */
  export function jwtDecode<T = any>(token: string, options?: JwtDecodeOptions): T;
  
  export interface JwtDecodeOptions {
    header?: boolean;
  }
} 