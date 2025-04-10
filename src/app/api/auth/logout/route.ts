import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // Get cookie store
    const cookieStore = await cookies();
    
    // Set a new cookie that expires immediately to remove the auth token
    cookieStore.set({
      name: 'auth-token',
      value: '',
      maxAge: 0, // Immediately expire the cookie
      path: '/',
    });
    
    console.log('Logout completed, auth cookie cleared');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error during logout:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
} 