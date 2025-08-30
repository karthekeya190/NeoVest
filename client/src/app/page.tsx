// client/src/app/page.tsx
'use client';
import "./globals.css";
import { useEffect, useState } from "react";
import { signOut } from 'firebase/auth';
import { auth } from "@/lib/firebaseClient";
import AuthForm from "@/components/auth/AuthForm";
import Dashboard from "@/components/dashboard/Dashboard";

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
              NeoVest
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Your Intelligent Finance Assistant
            </p>
          </div>
          
          <AuthForm 
            mode={authMode} 
            onToggleMode={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                NeoVest
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 dark:text-gray-300">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <Dashboard />
    </div>
  );
}