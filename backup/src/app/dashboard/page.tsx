'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext'; // Use the hook
import { useRouter } from 'next/navigation'; // Use App Router navigation

// Basic placeholder for the dashboard page
// In a real app, this would fetch user data, display relevant info, etc.
// It might check for the token received from the backend redirect.
const DashboardPage = () => {
  const { userId, isLoading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until loading is finished before checking auth
    if (!isLoading) {
      if (!userId) {
        // If not loading and no userId, redirect to home
        console.log('User not authenticated, redirecting from dashboard...');
        router.replace('/'); // Use replace to avoid adding login to history
      } else {
        // User is authenticated
        console.log('User authenticated on dashboard, userId:', userId);
      }
    }
  }, [userId, isLoading, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }
  
  // Optionally show error state
  if (error) {
     return (
       <div className="flex justify-center items-center min-h-screen">
         <p className="text-error">Error checking authentication: {error}</p>
       </div>
     );
  }

  // Render dashboard content only if loading is complete and user is authenticated
  return (
    userId ? (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p>Welcome, User ID: {userId}</p>
        {/* Add more dashboard content here */}
      </div>
    ) : null // Render nothing while redirecting
  );
};

export default DashboardPage;