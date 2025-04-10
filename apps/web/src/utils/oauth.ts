/**
 * Generates a random string for OAuth state and code verifier
 * @param length Length of the random string
 * @returns Random string
 */
export function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/**
 * Creates a code challenge from a code verifier (for PKCE)
 * @param codeVerifier The code verifier
 * @returns Code challenge
 */
export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  // Convert the code verifier to a Uint8Array
  const data = new TextEncoder().encode(codeVerifier);
  
  // Hash the code verifier using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert the hash to a Base64URL-encoded string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashString = hashArray
    .map(byte => String.fromCharCode(byte))
    .join('');
  
  const base64 = btoa(hashString);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
} 