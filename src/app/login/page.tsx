"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import TruecallerSignup from '@/components/TruecallerSignup';

// Load keys from environment variables
const TRUECALLER_PARTNER_KEY = process.env.NEXT_PUBLIC_TRUECALLER_PARTNER_KEY || "";
const TRUECALLER_PARTNER_NAME = process.env.NEXT_PUBLIC_TRUECALLER_PARTNER_NAME || "";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkAuthStatus, userId, isLoading } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check for auth_success parameter in the URL
    const authSuccess = searchParams.get('auth_success');
    const errorParam = searchParams.get('error');
    
    if (errorParam) {
      setMessage(`Login error: ${errorParam}`);
      setPageLoading(false);
      return;
    }
    
    if (authSuccess === 'true') {
      console.log('Auth success detected in URL parameters');
      setMessage('Authentication successful! Redirecting to dashboard...');
      
      // Refresh auth status to ensure cookie is recognized
      checkAuthStatus().then(() => {
        // After auth check, redirect to dashboard
        console.log('Redirecting to dashboard after successful authentication');
        router.push('/dashboard');
      });
    } else {
      setPageLoading(false);
    }
  }, [searchParams, checkAuthStatus, router]);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (userId && !isLoading) {
      router.push('/dashboard');
    } else if (!isLoading) {
      setPageLoading(false);
    }
  }, [userId, isLoading, router]);

  if (pageLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-base-100 p-4">
        <div className="w-full max-w-md p-6 bg-base-200 rounded-lg shadow-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Flattr</h1>
            <div className="flex justify-center">
              <span className="loading loading-spinner text-primary"></span>
            </div>
            <p className="mt-4">{message || 'Loading...'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base-100 p-4">
      <div className="w-full max-w-md p-6 bg-base-200 rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Log in to Flattr</h1>
          <p className="text-base-content/70 mt-2">Find your perfect flatmate</p>
        </div>

        {message && (
          <div className="alert alert-info mb-4">
            <span>{message}</span>
          </div>
        )}

        <TruecallerSignup 
          partnerKey={TRUECALLER_PARTNER_KEY}
          partnerName={TRUECALLER_PARTNER_NAME}
        />
      </div>
    </div>
  );
}
