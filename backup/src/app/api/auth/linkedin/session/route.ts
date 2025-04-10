import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      console.error('LinkedIn session creation failed: User ID is required');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`Creating JWT session for user ID: ${userId}`);

    // Get the JWT secret from environment
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create a JWT token that will be stored in the cookie
    const token = await new SignJWT({ userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // Token expires in 7 days
      .sign(new TextEncoder().encode(jwtSecret));

    console.log(`JWT token generated successfully for user: ${userId} (length: ${token.length})`);

    // Log request host information for debugging
    console.log('Request headers:', {
      host: req.headers.get('host'),
      'x-forwarded-host': req.headers.get('x-forwarded-host'),
      origin: req.headers.get('origin'),
      referer: req.headers.get('referer')
    });

    // Determine cookie domain based on host
    const hostHeader = req.headers.get('host') || '';
    const xForwardedHost = req.headers.get('x-forwarded-host');
    
    // Use x-forwarded-host if available (for proxied requests)
    const host = xForwardedHost || hostHeader;
    
    let cookieDomain;
    if (host.includes('localhost') || /^\d+\.\d+\.\d+\.\d+/.test(host.split(':')[0])) {
      // For localhost or IP address, don't set domain
      cookieDomain = undefined;
    } else {
      // For real domains, set domain with leading dot for subdomains
      const domainParts = host.split(':')[0].split('.');
      if (domainParts.length >= 2) {
        cookieDomain = `.${domainParts.slice(-2).join('.')}`;
      }
    }

    console.log(`Setting cookie with domain: ${cookieDomain || '(undefined)'}`);

    // Create a response with success message
    const response = NextResponse.json({ success: true });
    
    // Set the cookie directly on the response
    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: true, // Always use secure cookies
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      sameSite: 'none', // Allow cross-site cookies for OAuth flows
      domain: cookieDomain,
      partitioned: true, // Support partitioned cookies
    });

    console.log(`Cookie has been set for user: ${userId}`);

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error setting session cookie:', errorMessage);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to create session', details: errorMessage },
      { status: 500 }
    );
  }
} 