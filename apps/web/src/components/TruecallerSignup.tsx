"use client";

import React, { useState } from 'react';
import PrettyButton from './PrettyButton';

interface TruecallerSignupProps {
  partnerKey: string;
  partnerName: string;
}

// Export the enum
export enum AuthState {
  Idle,
  TruecallerLoading, // Truecaller flow initiated
  OtpPhoneInput,     // Prompting for phone number for OTP
  OtpCodeInput,      // Prompting for OTP code
  OtpLoading,        // Waiting for OTP request/verification
}

const TruecallerSignup: React.FC<TruecallerSignupProps> = ({ partnerKey, partnerName }) => {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [authState, setAuthState] = useState<AuthState>(AuthState.Idle);
  const [error, setError] = useState<string | null>(null);

  const generateNonce = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // --- Truecaller Deep Link Flow Handler ---
  const handleTruecallerSignUp = () => {
    setError(null);
    setAuthState(AuthState.TruecallerLoading);
    const isAndroid = /android/i.test(navigator.userAgent);

    if (!isAndroid) {
      setError("Truecaller verification is available on Android browsers. Please use OTP.");
      setAuthState(AuthState.Idle);
      return;
    }

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
      // loginHint removed - not needed for primary deep link flow
    });

    const deepLinkUrl = `truecallersdk://truesdk/web_verify?${deepLinkParams.toString().replace(/&/g, '&')}`;
    console.log('Attempting Truecaller Deep Link (Android):', deepLinkUrl);

    try {
      window.location.href = deepLinkUrl;
      setTimeout(() => {
        if (document.hasFocus()) {
          console.warn('Truecaller deep link failed or app not installed. Reverting state.');
          setError("Truecaller verification failed or app not installed. Try OTP.");
          setAuthState(AuthState.Idle); 
        } else {
          console.log('Truecaller dialog likely opened. Waiting for backend callback.');
        }
      }, 800); 
    } catch (err) {
      console.error("Error attempting Truecaller deep link:", err);
      setError("Could not start Truecaller verification. Please try OTP.");
      setAuthState(AuthState.Idle);
    }
  };

  // --- OTP Flow Handlers ---
  const handleOtpOptionClick = () => {
    setError(null);
    setAuthState(AuthState.OtpPhoneInput); // Move to phone input state for OTP
  };

  const handleRequestOtp = async () => {
    if (phoneNumber.length !== 10) {
        setError("Please enter a valid 10-digit phone number.");
        return;
    }
    setError(null);
    setAuthState(AuthState.OtpLoading);
    console.log(`Requesting OTP for +91${phoneNumber}...`);
    try {
      // *** Backend Interaction Needed for OTP Request ***
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      console.log('OTP request sent (simulated).');
      setAuthState(AuthState.OtpCodeInput); // Move to OTP code input state
    } catch (err: any) {
      console.error("Failed to request OTP:", err);
      setError(err.message || "Failed to send OTP. Please try again.");
      setAuthState(AuthState.OtpPhoneInput); // Go back to phone input on failure
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
        setError("Please enter a valid 6-digit OTP.");
        return;
    }
    setError(null);
    setAuthState(AuthState.OtpLoading);
    console.log(`Verifying OTP ${otp} for +91${phoneNumber}...`);
    try {
      // *** Backend Interaction Needed for OTP Verification ***
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('OTP verified (simulated). Redirecting...');
      window.location.href = '/dashboard'; // Redirect on success
    } catch (err: any) {
      console.error("Failed to verify OTP:", err);
      setError(err.message || "Invalid OTP. Please try again.");
      setAuthState(AuthState.OtpCodeInput); // Go back to code input on failure
    }
  };

  const isInputDisabled = authState === AuthState.TruecallerLoading || authState === AuthState.OtpLoading;

  return (
    <div className="w-full max-w-sm mx-auto">

      {/* Error Display */} 
      {error && authState !== AuthState.OtpPhoneInput && authState !== AuthState.OtpCodeInput && (
        <div className="alert alert-error shadow-lg text-sm mb-4 py-2 px-3">
          <div>
             <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-xs">{error}</span>
          </div>
        </div>
      )}

      {/* --- Initial State (Idle) --- */} 
      {authState === AuthState.Idle && (
        <>
          <PrettyButton
            className={`w-full mb-3 ${isInputDisabled ? 'loading' : ''}`}
            onClick={handleTruecallerSignUp}
            disabled={isInputDisabled}
          >
            {isInputDisabled ? 'Checking...' : 'Continue with Truecaller (Android)'}
          </PrettyButton>

          <PrettyButton
            className={`w-full btn-secondary ${isInputDisabled ? 'loading' : ''}`} // Secondary styling
            onClick={handleOtpOptionClick} // Go to phone input state
            disabled={isInputDisabled}
          >
            Continue with OTP
          </PrettyButton>
        </>
      )}

      {/* --- OTP Flow Stages (Simulated Bottom Sheet) --- */} 
      {(authState === AuthState.OtpPhoneInput || authState === AuthState.OtpCodeInput || authState === AuthState.OtpLoading) && (
          // Simulate bottom sheet appearance (e.g., add padding/background)
          <div className="mt-4 p-4 border rounded-lg shadow-md bg-base-100">
            <h3 className="text-lg font-semibold mb-3 text-center">
                {authState === AuthState.OtpCodeInput ? `Verify OTP for +91 ${phoneNumber}` : 'Login with OTP'}
            </h3>

            {/* Error Display within OTP flow */}
             {error && (
               <div className="alert alert-error shadow-lg text-sm mb-4 py-2 px-3">
                  <div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="text-xs">{error}</span>
                  </div>
                </div>
             )}

            {/* Phone Input for OTP */}
            {authState === AuthState.OtpPhoneInput && (
                <>
                    <div className="w-full mb-3">
                        <label htmlFor="otp-phone" className="block text-sm font-medium text-base-content/90 mb-1 sr-only">
                          Phone Number (India)
                        </label>
                        <div className="relative">
                           <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-base-content/60">
                              +91
                           </span>
                           <input
                            type="tel"
                            id="otp-phone"
                            name="otp-phone"
                            className="input input-bordered w-full pl-10 pr-4 py-2 text-base"
                            placeholder="Enter 10 digit number"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                            maxLength={10}
                            pattern="\d{10}"
                            required
                            disabled={isInputDisabled}
                          />
                        </div>
                    </div>
                     <PrettyButton
                        className={`w-full ${isInputDisabled ? 'loading' : ''}`}
                        onClick={handleRequestOtp}
                        disabled={isInputDisabled || phoneNumber.length !== 10}
                    >
                        {isInputDisabled ? 'Sending...' : 'Send OTP'}
                     </PrettyButton>
                </>
            )}

            {/* OTP Code Input */} 
            {authState === AuthState.OtpCodeInput && (
                <>
                    <div className="w-full mb-3">
                        <label htmlFor="otp-code" className="block text-sm font-medium text-base-content/90 mb-1">
                          Enter 6 digit OTP
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            id="otp-code"
                            name="otp-code"
                            className="input input-bordered w-full px-4 py-2 text-base"
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            maxLength={6}
                            required
                            disabled={isInputDisabled}
                        />
                    </div>
                    <PrettyButton
                        className={`w-full ${isInputDisabled ? 'loading' : ''}`}
                        onClick={handleVerifyOtp}
                        disabled={isInputDisabled || otp.length !== 6}
                    >
                       {isInputDisabled ? 'Verifying...' : 'Verify & Continue'}
                    </PrettyButton>
                </>
            )}

            {/* Loading Indicator for OTP */} 
            {authState === AuthState.OtpLoading && (
                 <div className="text-center mt-4">
                    <span className="loading loading-spinner text-primary"></span>
                 </div>
            )}

            {/* Back Button for OTP flow */} 
             <button
                 type="button"
                 className="btn btn-link btn-sm mt-3 w-full text-center"
                 onClick={() => { setAuthState(AuthState.Idle); setError(null); setOtp(''); setPhoneNumber('');}} // Go back to initial state
                 disabled={isInputDisabled}
             >
                Go Back
             </button>
          </div>
      )}

      {/* General Loading for Truecaller */}
      {authState === AuthState.TruecallerLoading && (
          <div className="text-center mt-4">
              <span className="loading loading-spinner text-primary"></span>
          </div>
      )}

    </div>
  );
};

export default TruecallerSignup; 