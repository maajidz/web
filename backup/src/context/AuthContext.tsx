'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';

interface AuthContextType {
  userId: string | null;
  isLoading: boolean;
  error: string | null;
  checkAuthStatus: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Define backend URL (read from environment variable)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

// Check if the environment variable is set
if (!BACKEND_URL) {
  throw new Error('NEXT_PUBLIC_BACKEND_API_URL environment variable is not defined!');
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading initially
  const [error, setError] = useState<string | null>(null);

  const checkAuthStatus = useCallback(async () => {
    console.log('Checking auth status...');
    setIsLoading(true);
    setError(null);
    try {
      // Fetch call requires credentials: 'include' to send HttpOnly cookies
      const response = await fetch(`/api/auth/profile`, {
        method: 'GET',
        credentials: 'include', // CRITICAL: This tells fetch to include cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Auth check successful, user ID:', data.id);
        setUserId(data.id || null);
      } else if (response.status === 401) {
        console.log('Auth check failed (401), user not logged in.');
        setUserId(null); // Not authenticated
      } else {
        // Handle other non-OK statuses (e.g., 500)
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Auth check failed with status:', response.status, errorData);
        setError(`Authentication check failed (Status: ${response.status}). ${errorData.error || ''}`);
        setUserId(null);
      }
    } catch (err) {
      console.error('Error checking auth status:', err);
      setError('Network error during authentication check.');
      setUserId(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    console.log('Logging out...');
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Send cookies to clear it
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('Logout successful.');
        setUserId(null); // Clear user state
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Logout failed with status:', response.status, errorData);
        setError(`Logout failed (Status: ${response.status}). ${errorData.error || ''}`);
        // Keep user state as is
      }
    } catch (err) {
      console.error('Error during logout:', err);
      setError('Network error during logout.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check auth status on initial mount
  useEffect(() => {
    console.log('AuthContext useEffect triggered. Checking auth status.');
    checkAuthStatus();
  }, [checkAuthStatus]);

  const value = {
    userId,
    isLoading,
    error,
    checkAuthStatus,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 