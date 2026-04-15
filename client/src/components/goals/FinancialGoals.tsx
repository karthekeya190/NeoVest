'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebaseClient';
import { FinancialGoal } from '@/types/firestore';

const GOAL_CATEGORIES = [
  'emergency_fund',
  'vacation',
  'car',
  'house',
  'education',
  'retirement',
  'wedding',
  'business',
  'other'
];

const GOAL_PRIORITIES = ['low', 'medium', 'high'];

interface FinancialGoalsProps {
  onGoalAdded?: () => void;
}

export default function FinancialGoals({ onGoalAdded }: FinancialGoalsProps) {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    category: '',
    priority: 'medium'
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const token = await user.getIdToken();
      const response = await fetch('http://localhost:8000/api/goals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      
      const goalData = {
        title: formData.title,
        description: formData.description,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount) || 0,
        targetDate: new Date(formData.targetDate).toISOString(),
        category: formData.category,
        priority: formData.priority
      };

      const response = await fetch('http://localhost:8000/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(goalData)
      });

      if (response.ok) {
        // Reset form
        setFormData({
          title: '',
          description: '',
          targetAmount: '',
          currentAmount: '',
          targetDate: '',
          category: '',
          priority: 'medium'
        });
        
        setShowAddForm(false);
        fetchGoals();
        
        if (onGoalAdded) {
          onGoalAdded();
        }
      }
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const updateGoalProgress = async (goalId: string, newAmount: number) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const response = await fetch(`http://localhost:8000/api/goals/${goalId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentAmount: newAmount })
      });

      if (response.ok) {
        fetchGoals();
      }
    } catch (error) {
      console.error('Error updating goal progress:', error);
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const response = await fetch(`http://localhost:8000/api/goals/${goalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchGoals();
        if (onGoalAdded) {
          onGoalAdded();
        }
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const getCategoryDisplay = (category: string) => {
    const displays = {
      emergency_fund: '🚨 Emergency Fund',
      vacation: '🏖️ Vacation',
      car: '🚗 Car',
      house: '🏠 House',
      education: '📚 Education',
      retirement: '👴 Retirement',
      wedding: '💒 Wedding',
      business: '💼 Business',
      other: '🎯 Other'
    };
    return displays[category as keyof typeof displays] || category;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Financial Goals
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          {showAddForm ? 'Cancel' : 'Add Goal'}
        </button>
      </div>

      {/* Add Goal Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-semibold mb-4">Add New Financial Goal</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                placeholder="e.g., Emergency Fund"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">Select Category</option>
                {GOAL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{getCategoryDisplay(cat)}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Target Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.targetAmount}
                onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                placeholder="e.g., 500000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Current Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.currentAmount}
                onChange={(e) => setFormData({...formData, currentAmount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Target Date</label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({...formData, targetDate: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              >
                {GOAL_PRIORITIES.map(priority => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                placeholder="Describe your goal..."
              />
            </div>
            
            <div className="md:col-span-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
              >
                Create Goal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-lg font-medium mb-2">No Financial Goals Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start by creating your first financial goal, like an emergency fund.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
            >
              Create Your First Goal
            </button>
          </div>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{goal.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getCategoryDisplay(goal.category)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                    {goal.priority.toUpperCase()}
                  </span>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                    title="Delete Goal"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{goal.progress ? Math.round(goal.progress) : 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(goal.progress || 0, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm mt-2 text-gray-600 dark:text-gray-400">
                  <span>₹{goal.currentAmount?.toLocaleString() || '0'}</span>
                  <span>₹{goal.targetAmount?.toLocaleString()}</span>
                </div>
              </div>
              
              {goal.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {goal.description}
                </p>
              )}
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">
                  Target: {new Date(goal.targetDate).toLocaleDateString()}
                </span>
                <button
                  onClick={() => {
                    const newAmount = prompt(`Update current amount for "${goal.title}":`, goal.currentAmount?.toString() || '0');
                    if (newAmount !== null) {
                      updateGoalProgress(goal.id, parseFloat(newAmount) || 0);
                    }
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Update Progress
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
