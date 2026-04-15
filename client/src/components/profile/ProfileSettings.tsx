'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebaseClient';
import { getCurrentUserProfile, updateUserProfile } from '@/lib/firestoreService';
import { User } from '@/types/firestore';
import { 
  UserIcon, 
  CurrencyDollarIcon, 
  CheckIcon,
  XMarkIcon,
  PencilIcon 
} from '@heroicons/react/24/outline';

interface ProfileSettingsProps {
  onProfileUpdated?: () => void;
}

export default function ProfileSettings({ onProfileUpdated }: ProfileSettingsProps) {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    monthlyIncome: '',
    age: '',
    riskTolerance: 'medium' as 'low' | 'medium' | 'high'
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const profileData = await getCurrentUserProfile();
        if (profileData) {
          setProfile(profileData);
          setFormData({
            displayName: profileData.displayName || '',
            monthlyIncome: profileData.monthlyIncome?.toString() || '',
            age: profileData.age?.toString() || '',
            riskTolerance: profileData.riskTolerance || 'medium'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Even if profile fetch fails, show the form so user can set their data
      setProfile({
        uid: auth.currentUser?.uid || '',
        email: auth.currentUser?.email || '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updateData = {
        displayName: formData.displayName || undefined,
        monthlyIncome: formData.monthlyIncome ? parseFloat(formData.monthlyIncome) : undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        riskTolerance: formData.riskTolerance
      };

      await updateUserProfile(updateData);
      
      // Refresh profile data
      await fetchProfile();
      setEditing(false);
      
      if (onProfileUpdated) {
        onProfileUpdated();
      }
      
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        monthlyIncome: profile.monthlyIncome?.toString() || '',
        age: profile.age?.toString() || '',
        riskTolerance: profile.riskTolerance || 'medium'
      });
    }
    setEditing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <UserIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Profile Settings
          </h3>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="text-blue-600 hover:text-blue-800 p-1 rounded"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-green-600 hover:text-green-800 p-1 rounded disabled:opacity-50"
            >
              <CheckIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="text-red-600 hover:text-red-800 p-1 rounded disabled:opacity-50"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Display Name
          </label>
          {editing ? (
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
              placeholder="Your display name"
            />
          ) : (
            <p className="text-gray-900 dark:text-white">
              {profile?.displayName || 'Not set'}
            </p>
          )}
        </div>

        {/* Monthly Income */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
            Monthly Income (INR)
          </label>
          {editing ? (
            <input
              type="number"
              value={formData.monthlyIncome}
              onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
              placeholder="50000"
              min="0"
              step="1000"
            />
          ) : (
            <p className="text-gray-900 dark:text-white">
              {profile?.monthlyIncome ? formatCurrency(profile.monthlyIncome) : 'Not set'}
            </p>
          )}
          {!editing && !profile?.monthlyIncome && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
              ⚠️ Set your monthly income to get accurate financial health insights
            </p>
          )}
        </div>

        {/* Age */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Age
          </label>
          {editing ? (
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
              placeholder="25"
              min="18"
              max="100"
            />
          ) : (
            <p className="text-gray-900 dark:text-white">
              {profile?.age || 'Not set'}
            </p>
          )}
        </div>

        {/* Risk Tolerance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Risk Tolerance
          </label>
          {editing ? (
            <select
              value={formData.riskTolerance}
              onChange={(e) => setFormData({ ...formData, riskTolerance: e.target.value as 'low' | 'medium' | 'high' })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          ) : (
            <p className="text-gray-900 dark:text-white capitalize">
              {profile?.riskTolerance || 'Medium'}
            </p>
          )}
        </div>

        {/* Account Info */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Account Information
          </h4>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              Email: {profile?.email}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Member since: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </div>
      </div>

      {editing && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 <strong>Tip:</strong> Setting your monthly income helps calculate your financial health score and provides personalized recommendations.
          </p>
        </div>
      )}
    </div>
  );
}
