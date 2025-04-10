'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

function LinkedInCallbackContent() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function handleCallback() {
      try {
        setLoading(true);
        
        // Get the authorization code and state from URL parameters
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        // Check for errors in the callback
        if (error) {
          console.error('LinkedIn OAuth error:', error, errorDescription);
          setError(errorDescription || 'Error during LinkedIn authentication');
          setLoading(false);
          return;
        }
        
        // Validate the state to prevent CSRF attacks
        const savedState = sessionStorage.getItem('linkedin_state');
        if (!state || state !== savedState) {
          console.error('Invalid state parameter');
          setError('Security validation failed');
          setLoading(false);
          return;
        }
        
        // Get the code verifier from session storage
        const codeVerifier = sessionStorage.getItem('linkedin_code_verifier');
        if (!codeVerifier) {
          console.error('Code verifier not found');
          setError('Authentication context lost');
          setLoading(false);
          return;
        }
        
        // Exchange the authorization code for tokens
        const tokenResponse = await fetch('/api/auth/linkedin/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            codeVerifier,
            redirectUri: process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI,
          }),
        });
        
        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json();
          console.error('Token exchange failed:', errorData);
          setError('Failed to complete authentication');
          setLoading(false);
          return;
        }
        
        const { accessToken, idToken, profile } = await tokenResponse.json();
        
        // Get user data from the profile
        const { sub, email, name, given_name, family_name, picture } = profile;
        
        // Check if user exists in Supabase
        const { data: existingUser, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('linkedin_id', sub)
          .single();
          
        if (userError && userError.code !== 'PGRST116') { // PGRST116 = Not found
          console.error('Error checking for existing user:', userError);
          setError('Error verifying user account');
          setLoading(false);
          return;
        }
        
        // Check if user exists with this email but different auth method
        const { data: emailUser, error: emailError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();
          
        if (emailError && emailError.code !== 'PGRST116') {
          console.error('Error checking for user by email:', emailError);
          setError('Error verifying user account');
          setLoading(false);
          return;
        }
        
        // Determine if user exists and how to handle them
        if (existingUser) {
          // User already exists with LinkedIn auth - update their profile
          const { error: updateError } = await supabase
            .from('users')
            .update({
              name: name || existingUser.name,
              first_name: given_name || existingUser.first_name,
              last_name: family_name || existingUser.last_name,
              profile_picture: picture || existingUser.profile_picture,
              last_login: new Date().toISOString(),
              // Don't update signup_sequence as they're already a LinkedIn user
            })
            .eq('id', existingUser.id);
            
          if (updateError) {
            console.error('Error updating user:', updateError);
            setError('Failed to update user profile');
            setLoading(false);
            return;
          }
          
          // Set auth cookie
          await fetch('/api/auth/linkedin/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: existingUser.id,
            }),
            credentials: 'include',
          });
          
          // Add debug logging
          console.log('Auth session created for existing user:', existingUser.id);
          
          // Wait a moment for cookies to be properly set
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Verify the cookie is set
          const cookies = document.cookie.split(';').map(c => c.trim());
          const authCookie = cookies.find(c => c.startsWith('auth-token='));
          console.log('Auth cookie present after session creation:', !!authCookie);
          
          // Redirect to dashboard
          router.push('/dashboard');
        } else if (emailUser) {
          // User exists with this email but used a different auth method
          // Update their profile to include LinkedIn ID and update their signup sequence
          let signupSequence = emailUser.signup_sequence || [];
          
          // Add 'linkedin' to the signup sequence if not already present
          if (!signupSequence.includes('linkedin')) {
            signupSequence.push('linkedin');
          }
          
          const { error: updateError } = await supabase
            .from('users')
            .update({
              linkedin_id: sub,
              name: name || emailUser.name,
              first_name: given_name || emailUser.first_name,
              last_name: family_name || emailUser.last_name,
              profile_picture: picture || emailUser.profile_picture,
              last_login: new Date().toISOString(),
              signup_sequence: signupSequence,
            })
            .eq('id', emailUser.id);
            
          if (updateError) {
            console.error('Error updating user with LinkedIn data:', updateError);
            setError('Failed to update user profile');
            setLoading(false);
            return;
          }
          
          // Set auth cookie
          await fetch('/api/auth/linkedin/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: emailUser.id,
            }),
            credentials: 'include',
          });
          
          // Add debug logging
          console.log('Auth session created for email user:', emailUser.id);
          
          // Wait a moment for cookies to be properly set
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Verify the cookie is set
          const cookies = document.cookie.split(';').map(c => c.trim());
          const authCookie = cookies.find(c => c.startsWith('auth-token='));
          console.log('Auth cookie present after session creation:', !!authCookie);
          
          // Redirect to dashboard
          router.push('/dashboard');
        } else {
          // New user - create a new account
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              linkedin_id: sub,
              email: email,
              name: name,
              first_name: given_name,
              last_name: family_name,
              profile_picture: picture,
              created_at: new Date().toISOString(),
              last_login: new Date().toISOString(),
              signup_sequence: ['linkedin'],
            })
            .select()
            .single();
            
          if (createError) {
            console.error('Error creating new user:', createError);
            setError('Failed to create user account');
            setLoading(false);
            return;
          }
          
          // Set auth cookie
          await fetch('/api/auth/linkedin/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: newUser.id,
            }),
            credentials: 'include',
          });
          
          // Add debug logging
          console.log('Auth session created for new user:', newUser.id);
          
          // Wait a moment for cookies to be properly set
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Verify the cookie is set
          const cookies = document.cookie.split(';').map(c => c.trim());
          const authCookie = cookies.find(c => c.startsWith('auth-token='));
          console.log('Auth cookie present after session creation:', !!authCookie);
          
          // Redirect to onboarding or dashboard
          router.push('/onboarding');
        }
        
      } catch (err) {
        console.error('LinkedIn callback error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
        
        // Clean up session storage
        sessionStorage.removeItem('linkedin_state');
        sessionStorage.removeItem('linkedin_code_verifier');
      }
    }
    
    handleCallback();
  }, [router, searchParams, supabase]);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-base-100">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">
            {error ? 'Authentication Error' : 'Completing Login'}
          </h1>
          
          {loading ? (
            <div className="flex flex-col items-center">
              <div className="loading loading-spinner text-primary loading-lg"></div>
              <p className="mt-4 text-base-content">
                Verifying your LinkedIn account...
              </p>
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="text-error mb-4">{error}</div>
              <button
                onClick={() => router.push('/')}
                className="btn btn-primary"
              >
                Back to Home
              </button>
            </div>
          ) : (
            <p className="text-base-content">
              Authentication successful! Redirecting...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Loading fallback UI for the Suspense boundary
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-base-100">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Loading...</h1>
          <div className="flex flex-col items-center">
            <div className="loading loading-spinner text-primary loading-lg"></div>
            <p className="mt-4 text-base-content">
              Preparing authentication...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LinkedInCallback() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LinkedInCallbackContent />
    </Suspense>
  );
} 