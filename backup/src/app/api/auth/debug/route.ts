import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, decodeJwt } from 'jose';

export async function GET(req: NextRequest) {
  try {
    // Get the Cookie header and parse it
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      if (name) acc[name] = value;
      return acc;
    }, {} as Record<string, string>);
    
    // Get the auth token from cookies
    const authToken = cookies['auth-token'];
    
    // Gather response data
    const responseData: any = {
      timestamp: new Date().toISOString(),
      cookies: {
        names: Object.keys(cookies),
        hasAuthToken: !!authToken,
      },
      headers: {
        host: req.headers.get('host'),
        'x-forwarded-host': req.headers.get('x-forwarded-host'),
        'x-forwarded-proto': req.headers.get('x-forwarded-proto'),
        referer: req.headers.get('referer'),
        origin: req.headers.get('origin'),
      },
    };
    
    // If there's an auth token, try to parse it
    if (authToken) {
      try {
        // Decode the token (without verification)
        const decoded = decodeJwt(authToken);
        
        responseData.token = {
          decoded: {
            hasUserId: !!decoded.userId || !!decoded.sub,
            expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'unknown',
            issuedAt: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : 'unknown',
          }
        };
        
        // Try to verify the token
        const jwtSecret = process.env.JWT_SECRET;
        if (jwtSecret) {
          try {
            const verified = await jwtVerify(authToken, new TextEncoder().encode(jwtSecret));
            responseData.token.verified = true;
          } catch (verifyError) {
            responseData.token.verified = false;
            responseData.token.verifyError = verifyError instanceof Error 
              ? verifyError.message 
              : String(verifyError);
          }
        } else {
          responseData.token.verified = false;
          responseData.token.verifyError = 'JWT_SECRET is not configured';
        }
      } catch (decodeError) {
        responseData.token = {
          error: 'Failed to decode token',
          details: decodeError instanceof Error ? decodeError.message : String(decodeError)
        };
      }
    }
    
    return NextResponse.json(responseData);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error in debug endpoint:', errorMsg);
    return NextResponse.json(
      { error: 'Debug endpoint error', details: errorMsg },
      { status: 500 }
    );
  }
} 