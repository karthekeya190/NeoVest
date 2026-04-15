'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebaseClient';
import { getBudgets, createBudget, getBudgetStatus } from '@/lib/firestoreService';
import { Budget } from '@/types/firestore';
import { PlusIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Investment',
  'Other'
];

const BUDGET_PERIODS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
];

interface BudgetTrackerProps {
  onBudgetAdded?: () => void;
}

export default function BudgetTracker({ onBudgetAdded }: BudgetTrackerProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetStatus, setBudgetStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly',
    alertThreshold: '80'
  });

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const [budgetsResponse, statusResponse] = await Promise.all([
          getBudgets(),
          getBudgetStatus()
        ]);
        
        setBudgets(budgetsResponse.budgets || []);
        setBudgetStatus(statusResponse);
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const user = auth.currentUser;
      if (!user) return;

      const now = new Date();
      let startDate, endDate;

      // Calculate start and end dates based on period
      switch (formData.period) {
        case 'weekly':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
          endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
          break;
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        default: // monthly
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      const budgetData = {
        category: formData.category,
        amount: parseFloat(formData.amount),
        period: formData.period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        alertThreshold: parseFloat(formData.alertThreshold)
      };

      await createBudget(budgetData);
      
      // Reset form
      setFormData({
        category: '',
        amount: '',
        period: 'monthly',
        alertThreshold: '80'
      });
      
      setShowAddForm(false);
      fetchBudgets();
      
      if (onBudgetAdded) {
        onBudgetAdded();
      }
      
    } catch (error) {
      console.error('Error adding budget:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (budget: Budget) => {
    if (budget.isOverBudget) return 'bg-red-500';
    if (budget.isNearAlert) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = (budget: Budget) => {
    if (budget.isOverBudget) return 'Over Budget';
    if (budget.isNearAlert) return 'Near Limit';
    return 'On Track';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Status Summary */}
      {budgetStatus && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Budget Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {formatCurrency(budgetStatus.totalBudgeted)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Budgeted</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {formatCurrency(budgetStatus.totalSpent)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Spent</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${budgetStatus.remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(budgetStatus.remainingBudget)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Remaining</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {budgetStatus.overallSpentPercentage.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Spent</p>
            </div>
          </div>

          {/* Alerts */}
          {(budgetStatus.overBudgetCount > 0 || budgetStatus.nearAlertCount > 0) && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                {budgetStatus.overBudgetCount > 0 && (
                  <div className="flex items-center text-red-600">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">
                      {budgetStatus.overBudgetCount} budget(s) exceeded
                    </span>
                  </div>
                )}
                {budgetStatus.nearAlertCount > 0 && (
                  <div className="flex items-center text-yellow-600">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">
                      {budgetStatus.nearAlertCount} budget(s) near limit
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Budget Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Budget Categories ({budgets.length})
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Budget
        </button>
      </div>

      {/* Add Budget Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Select a category</option>
                  {EXPENSE_CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Budget Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Period *
                </label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData({...formData, period: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  required
                >
                  {BUDGET_PERIODS.map(period => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alert Threshold (%) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.alertThreshold}
                  onChange={(e) => setFormData({...formData, alertThreshold: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  placeholder="80"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Create Budget
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budget List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No budgets set yet. Create your first budget to start tracking your spending.
            </p>
          </div>
        ) : (
          budgets.map((budget) => (
            <div key={budget.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    {budget.category}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                    {budget.period}
                  </p>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(budget)} mr-2`}></div>
                  <span className={`text-xs font-medium ${
                    budget.isOverBudget ? 'text-red-600' :
                    budget.isNearAlert ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {getStatusText(budget)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Spent</span>
                  <span className="font-medium text-gray-800 dark:text-white">
                    {formatCurrency(budget.spentAmount || 0)}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Budget</span>
                  <span className="font-medium text-gray-800 dark:text-white">
                    {formatCurrency(budget.amount)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Remaining</span>
                  <span className={`font-medium ${
                    (budget.remainingAmount || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(budget.remainingAmount || 0)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-300">Progress</span>
                    <span className={`font-medium ${
                      (budget.spentPercentage || 0) > 100 ? 'text-red-600' :
                      (budget.spentPercentage || 0) >= budget.alertThreshold ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {(budget.spentPercentage || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        (budget.spentPercentage || 0) > 100 ? 'bg-red-500' :
                        (budget.spentPercentage || 0) >= budget.alertThreshold ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(budget.spentPercentage || 0, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
