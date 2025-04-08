"use client"; // Mark as Client Component to use hooks

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation'; // Hook to read search params
import Script from 'next/script'; // Import next/script
import SwipeCard from './SwipeCard';
import PrettyButton from './PrettyButton';
import { useOSDetection } from '@/hooks/useOSDetection'; // Import OS detection hook

// Simplified Auth State for this component
enum AuthProcessState {
  Idle,
  TruecallerLoading, // Waiting for Truecaller deep link
  PhoneEmailLoading, // Waiting for Phone.email verification via backend
  PhoneEmailTriggered, // State to indicate Phone.Email button should be shown/active
}

// Props might not be needed if keys come from env vars later
interface HeroSectionProps {
  partnerKey: string; // Truecaller partner key
  partnerName: string; // Truecaller partner name
  phoneEmailClientId: string; // Phone.email client ID (placeholder)
}

// Helper function to map error codes to user-friendly messages
const getErrorMessage = (errorCode: string | null): string | null => {
  if (!errorCode) return null;
  // Keep existing error mapping logic or simplify as needed
  switch (errorCode) {
    case 'TC_FAILED': return "Truecaller verification failed or was cancelled.";
    case 'PE_FAILED': return "Phone number verification failed. Please try again.";
    case 'BACKEND_ERROR': return "An error occurred during login. Please try again later.";
    // Add more specific errors from backend if available
    default: return "An unknown error occurred.";
  }
};

// Sample data for the cards
const profiles = [
  {
    name: 'Emma', age: 26, role: 'Designer', location: 'Central London',
    imageUrl: 'https://public.readdy.ai/ai/img_res/7f16b849600ff92baae15bfc6316e519.jpg',
    budget: '£800-950/mo', moveInDate: 'May 1st', tags: ['Non-smoker', 'Pet friendly', 'Early riser']
  },
  {
    name: 'James', age: 29, role: 'Software Dev', location: 'East London',
    imageUrl: 'https://public.readdy.ai/ai/img_res/657fc3436b9e3ec306b8b42bfd7da962.jpg',
    budget: '£900-1100/mo', moveInDate: 'June 15th', tags: ['Quiet', 'Tech lover', 'Night owl']
  },
  {
    name: 'Olivia', age: 24, role: 'Student', location: 'North London',
    imageUrl: 'https://public.readdy.ai/ai/img_res/714cf5f6b7a2cc778c84ce296138ba13.jpg',
    budget: '£700-850/mo', moveInDate: 'April 20th', tags: ['Vegetarian', 'Social', 'Clean']
  }
];

// Update component to accept props
const HeroSection: React.FC<HeroSectionProps> = ({ partnerKey, partnerName, phoneEmailClientId }) => {
  const searchParams = useSearchParams();
  const os = useOSDetection(); // Get the detected OS

  // State Management
  const [authError, setAuthError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthProcessState>(AuthProcessState.Idle);
  // Add state to hold the Phone.Email button code/config from props/env later
  // const [phoneEmailConfig, setPhoneEmailConfig] = useState<string | null>(null);

  useEffect(() => {
    const errorCode = searchParams.get('error');
    const errorMessage = getErrorMessage(errorCode);
    setAuthError(errorMessage);
  }, [searchParams]);

  // --- Phone.email Listener ---
  useEffect(() => {
    // Define the listener function on the window object
    (window as any).phoneEmailListener = async (payload: any) => {
      console.log("Phone.email Listener Payload:", payload);
      setAuthError(null); // Clear previous errors

      // Check if verification was successful based on payload structure
      // Assuming the payload itself contains user_json_url directly on success
      if (payload && payload.user_json_url) { // Simplified check based on provided snippet
        setAuthState(AuthProcessState.PhoneEmailLoading);
        try {
          // Construct the absolute URL for the backend API
          const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
          if (!backendApiUrl) {
            throw new Error("Backend API URL is not configured.");
          }

          const verifyUrl = `${backendApiUrl}/auth/phone-email/verify`;
          console.log(`Sending verification request to: ${verifyUrl}`); // Log the target URL

          // Send the user_json_url to your backend for final verification and login
          const response = await fetch(verifyUrl, { // Use the absolute URL
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_json_url: payload.user_json_url }),
          });

          if (!response.ok) {
            // Try to parse error message from backend response
            let errorMsg = 'Verification failed on backend.';
            try {
               const errorData = await response.json();
               errorMsg = errorData.message || errorMsg;
            } catch (parseError) {
               // Ignore if response isn't valid JSON
               console.error("Could not parse error response from backend:", parseError);
            }
            throw new Error(errorMsg);
          }

          const result = await response.json(); // Expecting { success: true, userId: ... }
          console.log('Backend verification successful:', result);

          // Redirect to dashboard on successful login
          window.location.href = '/dashboard';

        } catch (err: any) {
          console.error("Backend phone.email verification failed:", err);
          setAuthError(getErrorMessage('BACKEND_ERROR') || err.message || "Verification failed.");
          setAuthState(AuthProcessState.Idle); // Reset state on error
        }
        // No finally block needed here as redirect handles the success case,
        // and catch block handles the error case. The loading state is naturally
        // replaced by the redirect or the Idle state + error message.

      } else {
        // Handle failed verification from Phone.email script (e.g., user closed popup)
        console.error("Phone.email verification failed or payload missing URL:", payload);
        // Don't necessarily set an error, user might have just cancelled. Reset state.
        // setAuthError(getErrorMessage('PE_FAILED')); // Optional: show error if desired
        setAuthState(AuthProcessState.Idle); // Reset state
      }
    };

    // Cleanup the listener when the component unmounts
    return () => {
      delete (window as any).phoneEmailListener;
    };
    // Dependency array: Include state variables used inside the listener if their
    // change should redefine the listener. In this case, it's primarily defining
    // a static callback, so an empty array might be sufficient, but including
    // authState ensures it's defined within the correct state context if needed.
  }, []); // Changed dependency array to empty

  const generateNonce = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // --- Truecaller Deep Link Flow Handler ---
  const handleTruecallerSignUp = () => {
    setAuthError(null);
    setAuthState(AuthProcessState.TruecallerLoading);

    const requestNonce = generateNonce();
    const lang = 'en';
    const privacyUrl = encodeURIComponent(process.env.NEXT_PUBLIC_PRIVACY_URL || 'https://flattr.io/privacy');
    const termsUrl = encodeURIComponent(process.env.NEXT_PUBLIC_TERMS_URL || 'https://flattr.io/terms');

    const deepLinkParams = new URLSearchParams({
      type: 'btmsheet',
      requestNonce: requestNonce,
      partnerKey: partnerKey,
      partnerName: partnerName,
      lang: lang,
      privacyUrl: privacyUrl,
      termsUrl: termsUrl,
    });

    const deepLinkUrl = `truecallersdk://truesdk/web_verify?${deepLinkParams.toString().replace(/&/g, '&')}`;
    console.log('Attempting Truecaller Deep Link (Android):', deepLinkUrl);

    try {
      window.location.href = deepLinkUrl;

      setTimeout(() => {
        if (document.hasFocus()) {
          console.warn('Truecaller deep link failed or app not installed. Falling back to Phone.email');
          // *** REFINEMENT: Fallback to Phone.email instead of just resetting ***
          setAuthError("Truecaller verification failed. Please verify using your phone number."); // Inform user
          setAuthState(AuthProcessState.PhoneEmailTriggered); // Trigger Phone.email flow
        } else {
          console.log('Truecaller dialog likely opened. Waiting for backend callback.');
          // Remain in TruecallerLoading state
        }
      }, 800);
    } catch (err) {
      console.error("Error attempting Truecaller deep link:", err);
      setAuthError("Could not start Truecaller verification. Trying phone number verification.");
      // Fallback to Phone.email on immediate error too
      setAuthState(AuthProcessState.PhoneEmailTriggered);
    }
  };

  // --- Main Login Click Handler ---
  const handleLoginClick = () => {
    console.log("Detected OS:", os);
    setAuthError(null); // Clear previous errors

    if (os === 'Android') {
      handleTruecallerSignUp();
    } else {
      // iOS or Other: Trigger Phone.email flow
      // Simplest approach: change state to show the Phone.email button container
      console.log('OS is not Android, triggering Phone.email flow display.');
      setAuthState(AuthProcessState.PhoneEmailTriggered);
      // Alternatively, if Phone.email script provides a JS function to start:
      // if (typeof (window as any).PhoneEmail?.startVerification === 'function') {
      //   (window as any).PhoneEmail.startVerification();
      // } else {
      //    console.error("Phone.email start function not found.");
      //    setAuthState(AuthProcessState.PhoneEmailTriggered); // Fallback to showing button
      // }
    }
  };

  const isLoading = authState === AuthProcessState.TruecallerLoading || authState === AuthProcessState.PhoneEmailLoading;

  // Return class strings for z-index, opacity, and visibility
  const getCardStackClasses = (index: number): string => {
    if (index === 0) return 'z-30'; // Use Tailwind z-index class
    if (index === 1) return 'z-20 opacity-85'; // Use Tailwind z-index and opacity classes
    if (index === 2) return 'z-10 opacity-70'; // Use Tailwind z-index and opacity classes
    return 'hidden'; // Use Tailwind hidden class instead of display:none
  };

  // Return only the transform inline style object
  const getCardStackTransformStyle = (index: number): React.CSSProperties => {
    if (index === 1) return { transform: 'translateY(10px) scale(0.95)' };
    if (index === 2) return { transform: 'translateY(20px) scale(0.9)' };
    return {}; // No transform for index 0 or hidden cards
  };

  // --- Render Logic ---
  return (
    <>
      {/* Load Phone.email Script */}
      <Script
        src="https://www.phone.email/sign_in_button_v1.js" // Updated src
        strategy="lazyOnload" // Load after page content is ready
        onLoad={() => console.log('Phone.email button script loaded.')}
        onError={(e) => console.error('Failed to load Phone.email button script:', e)}
      />

    <section className="relative pt-8 pb-12 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/5 z-0"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2 z-0"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full filter blur-3xl translate-y-1/2 -translate-x-1/2 z-0"></div>

      <div className="relative z-10 px-4 py-8 flex flex-col items-center text-center">
        <h1 className="text-3xl font-bold text-primary-content mb-3">Find Your Perfect Flatmate</h1>
        <p className="text-base-content/80 mb-6 max-w-xs">Verify your number to get started.</p>

          {/* General Auth Error Display */}
        {authError && (
          <div className="alert alert-error shadow-lg text-sm mb-4 max-w-sm mx-auto">
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{authError}</span>
            </div>
          </div>
        )}

          {/* --- Conditional UI based on AuthState --- */}

          {/* Initial Button or Loading State - Show if Idle or Loading */}
          {(authState === AuthProcessState.Idle || isLoading) && (
            <button 
              className={`btn btn-primary btn-sm ${isLoading ? 'loading' : ''}`}
              onClick={handleLoginClick}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Login / Sign Up'}
            </button>
          )}

           {/* Loading state specifically for Truecaller */}
           {authState === AuthProcessState.TruecallerLoading && (
             <div className="text-center mt-4">
                <span className="loading loading-spinner text-primary loading-lg"></span>
                <p className="mt-2 text-sm">Waiting for Truecaller...</p>
             </div>
           )}

          {/* Phone.email Button Container - Always rendered, hidden based on state */}
          <div className={`mt-4 w-full max-w-xs mx-auto flex flex-col items-center ${authState !== AuthProcessState.PhoneEmailTriggered || isLoading ? 'hidden' : ''}`}>
              {/* This div will be populated by the Phone.email script */}
              <div
                  className="pe_signin_button" // Script finds this on load
                  data-client-id={phoneEmailClientId}
              >
                  {/* Script inserts button here */} 
              </div>
              <p className="text-xs mt-2 text-base-content/60">Verify your phone number via Phone.email.</p>
              {/* Button to go back */}
              <button
                  className="btn btn-sm btn-ghost mt-2 text-xs"
                  onClick={() => setAuthState(AuthProcessState.Idle)}
                  disabled={isLoading}
              >
                  Cancel
              </button>
          </div>

            {/* Loading state specifically for PhoneEmail (after listener is called) */}
           {authState === AuthProcessState.PhoneEmailLoading && (
             <div className="text-center mt-4">
                <span className="loading loading-spinner text-primary loading-lg"></span>
                <p className="mt-2 text-sm">Verifying phone number...</p>
             </div>
           )}

          {/* Card Stack (keep commented out or implement) */}
        {/* <div className="relative h-[420px] w-full max-w-xs mx-auto">
          {profiles.map((profile, index) => (
            <SwipeCard
              key={profile.name} 
              profile={profile}
              // Apply only transform via inline style
              style={getCardStackTransformStyle(index)} 
              // Apply z-index, opacity, hidden, and cursor via className
              className={`${getCardStackClasses(index)} ${index === 0 ? 'cursor-grab' : ''}`} 
            />
          ))}
        </div> */}
      </div>
    </section>
    </>
  );
};

export default HeroSection; 