'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Use the hook
import { Button } from '@flattr/ui'; // Import from shared UI package

export default function Dashboard() {
  const router = useRouter();
  const auth = useAuth();

  if (!auth.isAuthenticated) {
    // If not authenticated, redirect to login page
    router.push('/');
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="stats shadow mb-6">
        <div className="stat">
          <div className="stat-title">Your Account</div>
          <div className="stat-value">{auth.profile?.name || 'User'}</div>
          <div className="stat-desc">{auth.profile?.email || ''}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Your Flatmate Preferences</h2>
            <p>Set up your preferences to find the perfect match.</p>
            <div className="card-actions justify-end">
              <Button variant="primary">Edit Preferences</Button>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Messages</h2>
            <p>Check your messages from potential flatmates.</p>
            <div className="card-actions justify-end">
              <Button variant="secondary">View Messages</Button>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Profile</h2>
            <p>Update your profile and personal information.</p>
            <div className="card-actions justify-end">
              <Button variant="outline">Edit Profile</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}