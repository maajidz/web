import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    // Get the auth token from cookies
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;
    
    // Log the token for debugging
    console.log('Auth token found:', !!authToken);
    
    if (!authToken) {
      console.log('No auth token found in cookies');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the JWT secret from environment
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    try {
      // Verify the JWT token
      const { payload } = await jwtVerify(
        authToken, 
        new TextEncoder().encode(jwtSecret)
      );
      
      const userId = payload.userId as string;
      
      if (!userId) {
        console.error('JWT payload does not contain userId');
        return NextResponse.json(
          { error: 'Invalid authentication token' },
          { status: 401 }
        );
      }
      
      // Initialize Supabase client
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase environment variables not configured');
        return NextResponse.json(
          { error: 'Database configuration error' },
          { status: 500 }
        );
      }
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Get user profile from Supabase
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json(
          { error: 'Failed to retrieve user profile' },
          { status: 500 }
        );
      }
      
      if (!user) {
        console.error('User not found in database');
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      // Return the user profile (excluding sensitive information)
      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        first_name: user.first_name,
        last_name: user.last_name,
        profile_picture: user.profile_picture,
        created_at: user.created_at,
      });
      
    } catch (jwtError) {
      const errorMessage = jwtError instanceof Error ? jwtError.message : String(jwtError);
      console.error('JWT verification failed:', errorMessage);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in profile endpoint:', errorMessage);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
} 