'use client';

import { useState, useEffect } from 'react';
import { getFinancialHealth, getNetWorth } from '@/lib/firestoreService';
import { auth } from '@/lib/firebaseClient';
import { FinancialHealth } from '@/types/firestore';
import { 
  HeartIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import ProfileSettings from '../profile/ProfileSettings';

export default function FinancialHealthDashboard() {
  const [healthData, setHealthData] = useState<FinancialHealth | null>(null);
  const [netWorth, setNetWorth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      if (user) {
        console.log('User ID:', user.uid);
        console.log('User email:', user.email);
      }
      setIsAuthenticated(!!user);
      if (user) {
        fetchHealthData();
      } else {
        setLoading(false);
        setError('Please sign in to view your financial health');
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchHealthData = async () => {
    try {
      setError(null);
      console.log('Fetching financial health data...');
      
      const [healthResponse, netWorthResponse] = await Promise.all([
        getFinancialHealth(),
        getNetWorth()
      ]);
      
      console.log('Health response:', healthResponse);
      console.log('Net worth response:', netWorthResponse);
      
      setHealthData(healthResponse);
      setNetWorth(netWorthResponse);
    } catch (error: any) {
      console.error('Error fetching financial health:', error);
      
      // Check if it's a "no data" scenario vs actual error
      if (error.message?.includes('API call failed')) {
        setError('Unable to calculate financial health. This might be because you need to add some expenses and set up your monthly income first.');
      } else {
        setError(error.message || 'Failed to load financial health data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHealthData();
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getFactorIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'good': return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'fair': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'poor': return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default: return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <HeartIcon className="h-8 w-8 mr-3 text-red-500" />
          Financial Health
        </h2>
        
        {/* Always show ProfileSettings */}
        <ProfileSettings onProfileUpdated={handleRefresh} />
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4 mx-auto"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <HeartIcon className="h-8 w-8 mr-3 text-red-500" />
          Financial Health
        </h2>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <div className="mb-4">
            <HeartIcon className="h-12 w-12 text-gray-400 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Sign In Required
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Please sign in to view your financial health dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <HeartIcon className="h-8 w-8 mr-3 text-red-500" />
          Financial Health
        </h2>
        
        {/* Always show ProfileSettings */}
        <ProfileSettings onProfileUpdated={handleRefresh} />
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <div className="mb-4">
            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Unable to Load Financial Health
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {error}
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              To see your financial health:
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 text-left space-y-1">
              <li>• Set your monthly income in the profile settings above</li>
              <li>• Add some expenses in the Expenses tab</li>
              <li>• Create financial goals (especially an emergency fund)</li>
              <li>• Add some investments to track your portfolio</li>
            </ul>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            {refreshing ? 'Loading...' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <HeartIcon className="h-8 w-8 mr-3 text-red-500" />
          Financial Health
        </h2>
        
        {/* Always show ProfileSettings */}
        <ProfileSettings onProfileUpdated={handleRefresh} />
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <div className="mb-4">
            <InformationCircleIcon className="h-12 w-12 text-blue-500 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Financial Data Available
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Start by setting your monthly income above, then add some expenses and goals to see your health score.
          </p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Check Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <HeartIcon className="h-8 w-8 mr-3 text-red-500" />
          Financial Health
        </h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Profile Settings */}
      <ProfileSettings onProfileUpdated={handleRefresh} />

      {/* Health Score Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="mb-4">
            <div className={`text-6xl font-bold ${getScoreColor(healthData.healthScore)}`}>
              {healthData.healthScore.toFixed(0)}
            </div>
            <div className="text-2xl font-semibold text-gray-600 dark:text-gray-300">/ 100</div>
          </div>
          
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getHealthColor(healthData.healthStatus)}`}>
            {healthData.healthStatus.charAt(0).toUpperCase() + healthData.healthStatus.slice(1)} Health
          </div>
          
          <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {healthData.healthMessage}
          </p>
        </div>
      </div>

      {/* Net Worth Summary */}
      {netWorth && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Net Worth Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(netWorth.netWorth)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Net Worth</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(netWorth.totalAssets)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Assets</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(netWorth.breakdown.investments)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Investments</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(netWorth.totalLiabilities)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Liabilities</p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Key Financial Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="text-center">
            <p className={`text-xl font-bold ${healthData.metrics.savingsRate >= 20 ? 'text-green-600' : healthData.metrics.savingsRate >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
              {healthData.metrics.savingsRate.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Savings Rate</p>
          </div>
          <div className="text-center">
            <p className={`text-xl font-bold ${healthData.metrics.expenseRatio <= 70 ? 'text-green-600' : healthData.metrics.expenseRatio <= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
              {healthData.metrics.expenseRatio.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Expense Ratio</p>
          </div>
          <div className="text-center">
            <p className={`text-xl font-bold ${healthData.metrics.emergencyFundMonths >= 6 ? 'text-green-600' : healthData.metrics.emergencyFundMonths >= 3 ? 'text-yellow-600' : 'text-red-600'}`}>
              {healthData.metrics.emergencyFundMonths.toFixed(1)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Emergency Fund (Months)</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-blue-600">
              {healthData.metrics.investmentCount}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Investments</p>
          </div>
          <div className="text-center">
            <p className={`text-xl font-bold ${healthData.metrics.investmentTypes >= 3 ? 'text-green-600' : healthData.metrics.investmentTypes >= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
              {healthData.metrics.investmentTypes}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Asset Types</p>
          </div>
        </div>
      </div>

      {/* Health Factors */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Health Factors
        </h3>
        <div className="space-y-3">
          {healthData.factors.map((factor, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                {getFactorIcon(factor.status)}
                <span className="ml-3 font-medium text-gray-800 dark:text-white">
                  {factor.factor}
                </span>
              </div>
              <div className="flex items-center">
                <span className={`text-sm font-medium mr-3 ${getScoreColor(factor.points)}`}>
                  {factor.points} pts
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(factor.status)}`}>
                  {factor.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Recommendations for Improvement
        </h3>
        {healthData.recommendations && healthData.recommendations.length > 0 ? (
          <div className="space-y-3">
            {healthData.recommendations.filter(rec => rec).map((recommendation, index) => (
              <div key={index} className="flex items-start p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                <p className="text-gray-700 dark:text-gray-300">{recommendation}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-300">
              Great job! You're doing well across all financial health factors.
            </p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Overall Progress
          </h3>
          <span className={`font-medium ${getScoreColor(healthData.healthScore)}`}>
            {healthData.healthScore.toFixed(1)}/100
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${
              healthData.healthScore >= 80 ? 'bg-green-500' :
              healthData.healthScore >= 60 ? 'bg-blue-500' :
              healthData.healthScore >= 40 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${healthData.healthScore}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>Poor (0-39)</span>
          <span>Fair (40-59)</span>
          <span>Good (60-79)</span>
          <span>Excellent (80-100)</span>
        </div>
      </div>
    </div>
  );
}
