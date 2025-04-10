import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Log environment variables for debugging (obfuscate sensitive data)
    console.log('LinkedIn credentials check:', {
      clientIdLength: process.env.LINKEDIN_CLIENT_ID?.length || 0,
      clientSecretLength: process.env.LINKEDIN_CLIENT_SECRET?.length || 0,
      clientIdExists: !!process.env.LINKEDIN_CLIENT_ID,
      clientSecretExists: !!process.env.LINKEDIN_CLIENT_SECRET,
      redirectUri: process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI
    });

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Received LinkedIn callback params:', {
        codeExists: !!requestBody.code,
        codeVerifierExists: !!requestBody.codeVerifier,
        redirectUriExists: !!requestBody.redirectUri,
        redirectUri: requestBody.redirectUri // Log the actual redirect URI
      });
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const { code, codeVerifier, redirectUri } = requestBody;

    // Validate required parameters
    if (!code || !redirectUri) {
      console.error('Missing required parameters:', { code: !!code, redirectUri: !!redirectUri });
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get LinkedIn app credentials from environment variables
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('LinkedIn OAuth credentials not configured:', { 
        clientIdExists: !!clientId, 
        clientSecretExists: !!clientSecret 
      });
      return NextResponse.json(
        { error: 'OAuth configuration error' },
        { status: 500 }
      );
    }

    // Exchange the authorization code for an access token using application/x-www-form-urlencoded format
    // which is required by LinkedIn's OAuth implementation
    const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'authorization_code');
    tokenParams.append('code', code);
    tokenParams.append('redirect_uri', redirectUri);
    tokenParams.append('client_id', clientId);
    tokenParams.append('client_secret', clientSecret);

    // If PKCE is used, add code_verifier
    if (codeVerifier) {
      tokenParams.append('code_verifier', codeVerifier);
    }

    console.log('Making LinkedIn token request with params:', {
      grantType: 'authorization_code',
      redirectUri,
      codeLength: code.length,
      codeVerifierLength: codeVerifier ? codeVerifier.length : 0,
    });

    // Make the token request
    let tokenResponse;
    try {
      tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: tokenParams.toString(),
      });
      
      console.log('LinkedIn token response status:', tokenResponse.status);
      
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
      console.error('Network error during LinkedIn token request:', errorMessage);
      return NextResponse.json(
        { error: 'Network error during token exchange', details: errorMessage },
        { status: 500 }
      );
    }

    // Handle error response
    if (!tokenResponse.ok) {
      let errorText;
      try {
        errorText = await tokenResponse.text();
        console.error('LinkedIn token exchange failed:', {
          status: tokenResponse.status,
          errorText,
        });
        
        try {
          const errorData = JSON.parse(errorText);
          return NextResponse.json(
            { error: 'Failed to exchange authorization code', details: errorData },
            { status: 500 }
          );
        } catch (e) {
          return NextResponse.json(
            { error: 'Failed to exchange authorization code', rawError: errorText },
            { status: 500 }
          );
        }
      } catch (textError) {
        console.error('Error reading LinkedIn error response:', textError);
        return NextResponse.json(
          { error: 'Failed to process error response from LinkedIn' },
          { status: 500 }
        );
      }
    }

    // Parse successful token response
    let tokenData;
    try {
      tokenData = await tokenResponse.json();
      console.log('LinkedIn token received successfully:', {
        accessTokenExists: !!tokenData.access_token,
        accessTokenLength: tokenData.access_token?.length || 0,
        idTokenExists: !!tokenData.id_token,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope
      });
    } catch (jsonError) {
      console.error('Failed to parse LinkedIn token response:', jsonError);
      return NextResponse.json(
        { error: 'Invalid token response format' },
        { status: 500 }
      );
    }

    const accessToken = tokenData.access_token;
    const idToken = tokenData.id_token; // For OpenID Connect flow

    if (!accessToken) {
      console.error('LinkedIn did not return an access token');
      return NextResponse.json(
        { error: 'No access token received' },
        { status: 500 }
      );
    }

    // Fetch user profile from LinkedIn using userinfo endpoint (OpenID Connect)
    let profileResponse;
    try {
      profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });
      
      console.log('LinkedIn profile response status:', profileResponse.status);
      
    } catch (profileFetchError) {
      const errorMessage = profileFetchError instanceof Error ? profileFetchError.message : String(profileFetchError);
      console.error('Network error during LinkedIn profile request:', errorMessage);
      return NextResponse.json(
        { error: 'Failed to fetch user profile', details: errorMessage },
        { status: 500 }
      );
    }

    if (!profileResponse.ok) {
      console.error('Failed to fetch LinkedIn profile:', {
        status: profileResponse.status,
      });
      
      // Try to get error details
      try {
        const errorText = await profileResponse.text();
        console.error('LinkedIn profile error response:', errorText);
        return NextResponse.json(
          { error: 'Failed to fetch user profile', details: errorText },
          { status: 500 }
        );
      } catch (e) {
        return NextResponse.json(
          { error: 'Failed to fetch user profile' },
          { status: 500 }
        );
      }
    }

    let profile;
    try {
      profile = await profileResponse.json();
      console.log('LinkedIn profile received successfully:', {
        profileIdExists: !!profile.sub,
        emailExists: !!profile.email,
        profileFields: Object.keys(profile)
      });
    } catch (profileJsonError) {
      console.error('Failed to parse LinkedIn profile response:', profileJsonError);
      return NextResponse.json(
        { error: 'Invalid profile response format' },
        { status: 500 }
      );
    }

    // Return the tokens and profile data
    return NextResponse.json({
      accessToken,
      idToken,
      profile,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('LinkedIn token exchange error:', errorMessage);
    return NextResponse.json(
      { error: 'Server error during authentication', details: errorMessage },
      { status: 500 }
    );
  }
} 