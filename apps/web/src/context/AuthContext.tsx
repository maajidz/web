'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the user profile type
export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
  created_at?: string;
}

// Define the auth context type
export interface AuthContextType {
  userId: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  profile: UserProfile | null;
  // Add any additional auth methods you need
  logout: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  userId: null,
  isLoading: true,
  error: null,
  isAuthenticated: false,
  profile: null,
  logout: async () => {}
});

// Create a provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/auth/profile', {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setUserId(data.id);
          setProfile(data);
          setError(null);
        } else {
          // If request fails, user is not authenticated
          setUserId(null);
          setProfile(null);
          if (response.status !== 401) {
            // Only set error for non-401 responses
            const errorData = await response.json();
            setError(errorData.error || 'Authentication failed');
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check authentication');
        setUserId(null);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setUserId(null);
        setProfile(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Logout failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to logout');
    }
  };

  const value = {
    userId,
    isLoading,
    error,
    isAuthenticated: !!userId,
    profile,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create a hook to use the auth context
export const useAuth = () => useContext(AuthContext); 