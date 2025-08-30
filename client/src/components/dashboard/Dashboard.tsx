// client/src/components/dashboard/Dashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebaseClient';
import { getUserExpenses, getUserFinancialGoals } from '@/lib/firestoreService';
import ExpenseTracker from '../expenses/ExpenseTracker';

interface DashboardStats {
  totalExpenses: number;
  monthlyExpenses: number;
  savingsGoals: number;
  investments: number;
  categoryBreakdown?: { [key: string]: number };
  expenseCount?: number;
}

interface RecentActivity {
  id: string;
  type: 'expense' | 'investment' | 'goal';
  description: string;
  amount: number;
  date: Date;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'investments' | 'goals'>('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalExpenses: 0,
    monthlyExpenses: 0,
    savingsGoals: 0,
    investments: 0,
    categoryBreakdown: {},
    expenseCount: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Function to refresh dashboard data (can be called from child components)
  const refreshDashboard = () => {
    fetchDashboardData();
  };

  const fetchDashboardData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Fetch real expenses data
      const expenses = await getUserExpenses(user.uid, 1000); // Get more expenses for accurate totals
      
      // Calculate real stats
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      const monthlyExpenses = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
        })
        .reduce((sum, expense) => sum + expense.amount, 0);

      // Fetch financial goals
      const goals = await getUserFinancialGoals(user.uid);
      const totalGoalTargets = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);

      // Calculate category breakdown
      const categoryBreakdown: { [key: string]: number } = {};
      expenses.forEach(expense => {
        if (categoryBreakdown[expense.category]) {
          categoryBreakdown[expense.category] += expense.amount;
        } else {
          categoryBreakdown[expense.category] = expense.amount;
        }
      });

      setStats({
        totalExpenses,
        monthlyExpenses,
        savingsGoals: totalGoalTargets,
        investments: 0, // Will be implemented later
        categoryBreakdown,
        expenseCount: expenses.length
      });

      // Create recent activity from expenses
      const recentExpenses = expenses.slice(0, 5).map(expense => ({
        id: expense.id,
        type: 'expense' as const,
        description: expense.description,
        amount: expense.amount,
        date: new Date(expense.date)
      }));

      setRecentActivity(recentExpenses);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'expenses', label: 'Expenses', icon: '💰' },
    { id: 'investments', label: 'Investments', icon: '📈' },
    { id: 'goals', label: 'Goals', icon: '🎯' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 whitespace-nowrap text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Financial Overview
              </h1>
              <button
                onClick={refreshDashboard}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <span className="mr-2">🔄</span>
                )}
                Refresh
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₹{stats.totalExpenses.toLocaleString()}
                    </p>
                    {stats.totalExpenses === 0 && (
                      <p className="text-xs text-gray-400">No expenses yet</p>
                    )}
                  </div>
                  <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
                    <span className="text-red-600 dark:text-red-400 text-xl">💸</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₹{stats.monthlyExpenses.toLocaleString()}
                    </p>
                    {stats.monthlyExpenses === 0 && (
                      <p className="text-xs text-gray-400">No spending this month</p>
                    )}
                  </div>
                  <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
                    <span className="text-yellow-600 dark:text-yellow-400 text-xl">📅</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.expenseCount || 0}
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                    <span className="text-green-600 dark:text-green-400 text-xl">📊</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg per Transaction</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₹{stats.expenseCount ? Math.round(stats.totalExpenses / stats.expenseCount).toLocaleString() : '0'}
                    </p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                    <span className="text-blue-600 dark:text-blue-400 text-xl">💳</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Category Breakdown */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
                <div className="space-y-3">
                  {stats.categoryBreakdown && Object.keys(stats.categoryBreakdown).length > 0 ? (
                    Object.entries(stats.categoryBreakdown)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 6)
                      .map(([category, amount]) => {
                        const percentage = stats.totalExpenses > 0 ? (amount / stats.totalExpenses) * 100 : 0;
                        return (
                          <div key={category} className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-gray-700 dark:text-gray-300">{category}</span>
                                <span className="text-gray-500 dark:text-gray-400">₹{amount.toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <div className="text-4xl mb-2">📊</div>
                      <p>No spending data yet</p>
                      <p className="text-sm">Add expenses to see category breakdown</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            activity.type === 'expense' ? 'bg-red-100 dark:bg-red-900' :
                            activity.type === 'investment' ? 'bg-green-100 dark:bg-green-900' :
                            'bg-blue-100 dark:bg-blue-900'
                          }`}>
                            <span className="text-sm">
                              {activity.type === 'expense' ? '💰' :
                               activity.type === 'investment' ? '📈' : '🎯'}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {activity.description}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {activity.date.toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        </div>
                        <div className={`text-sm font-medium ${
                          activity.type === 'expense' ? 'text-red-600 dark:text-red-400' : 
                          'text-green-600 dark:text-green-400'
                        }`}>
                          {activity.type === 'expense' ? '-' : '+'}₹{activity.amount.toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <div className="text-4xl mb-2">📊</div>
                      <p>No recent activity</p>
                      <p className="text-sm">Add your first expense to see activity here</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setActiveTab('expenses')}
                    className="p-4 text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <div className="text-2xl mb-2">💰</div>
                    <div className="text-sm font-medium">Add Expense</div>
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('goals')}
                    className="p-4 text-center bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                  >
                    <div className="text-2xl mb-2">🎯</div>
                    <div className="text-sm font-medium">Set Goal</div>
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('investments')}
                    className="p-4 text-center bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    <div className="text-2xl mb-2">📈</div>
                    <div className="text-sm font-medium">Invest</div>
                  </button>
                  
                  <button className="p-4 text-center bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors">
                    <div className="text-2xl mb-2">📊</div>
                    <div className="text-sm font-medium">Analytics</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && <ExpenseTracker onExpenseAdded={refreshDashboard} />}
        
        {activeTab === 'investments' && (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">Investment Tracking</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Track your portfolio, monitor performance, and get AI-powered investment recommendations.
            </p>
            <div className="bg-yellow-100 dark:bg-yellow-900/20 p-4 rounded-lg inline-block">
              <span className="text-yellow-800 dark:text-yellow-200">🚧 Coming Soon! Investment tracking features are under development.</span>
            </div>
          </div>
        )}
        
        {activeTab === 'goals' && (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">Financial Goals</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Set and track your financial goals with intelligent progress monitoring.
            </p>
            <div className="bg-yellow-100 dark:bg-yellow-900/20 p-4 rounded-lg inline-block">
              <span className="text-yellow-800 dark:text-yellow-200">🚧 Coming Soon! Goal tracking features are under development.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}