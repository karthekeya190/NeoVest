'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebaseClient';
import { getInvestments, createInvestment, getPortfolioSummary, getStockData, deleteInvestmentAPI } from '@/lib/firestoreService';
import { Investment, PortfolioSummary, MarketData } from '@/types/firestore';
import { PlusIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, TrashIcon } from '@heroicons/react/24/outline';

const INVESTMENT_TYPES = [
  { value: 'stocks', label: 'Stocks' },
  { value: 'etf', label: 'ETF' },
  { value: 'mutual_fund', label: 'Mutual Fund' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'bonds', label: 'Bonds' }
];

interface InvestmentTrackerProps {
  onInvestmentAdded?: () => void;
}

export default function InvestmentTracker({ onInvestmentAdded }: InvestmentTrackerProps) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchingSymbol, setSearchingSymbol] = useState(false);
  const [symbolData, setSymbolData] = useState<MarketData | null>(null);
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    type: 'stocks',
    quantity: '',
    purchasePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    exchange: '',
    notes: ''
  });

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const [investmentsResponse, portfolioResponse] = await Promise.all([
          getInvestments(),
          getPortfolioSummary()
        ]);
        
        setInvestments(investmentsResponse.investments || []);
        setPortfolioSummary(portfolioResponse);
      }
    } catch (error) {
      console.error('Error fetching investments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSymbolSearch = async () => {
    if (!formData.symbol) return;
    
    setSearchingSymbol(true);
    try {
      const stockData = await getStockData(formData.symbol);
      setSymbolData(stockData);
      setFormData(prev => ({
        ...prev,
        name: stockData.name,
        purchasePrice: stockData.price.toString()
      }));
    } catch (error) {
      console.error('Error fetching symbol data:', error);
      setSymbolData(null);
    } finally {
      setSearchingSymbol(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const user = auth.currentUser;
      if (!user) return;

      const investmentData = {
        symbol: formData.symbol.toUpperCase(),
        name: formData.name,
        type: formData.type,
        quantity: parseFloat(formData.quantity),
        purchasePrice: parseFloat(formData.purchasePrice),
        purchaseDate: formData.purchaseDate,
        exchange: formData.exchange,
        notes: formData.notes
      };

      await createInvestment(investmentData);
      
      // Reset form
      setFormData({
        symbol: '',
        name: '',
        type: 'stocks',
        quantity: '',
        purchasePrice: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        exchange: '',
        notes: ''
      });
      
      setShowAddForm(false);
      setSymbolData(null);
      fetchInvestments();
      
      if (onInvestmentAdded) {
        onInvestmentAdded();
      }
      
    } catch (error) {
      console.error('Error adding investment:', error);
    }
  };

  const handleDeleteInvestment = async (investmentId: string, investmentName: string) => {
    if (!confirm(`Are you sure you want to delete "${investmentName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteInvestmentAPI(investmentId);
      
      // Show success message
      alert(`Successfully deleted "${investmentName}"`);
      
      // Refresh the list
      fetchInvestments();
      
      if (onInvestmentAdded) {
        onInvestmentAdded(); // Refresh parent component if needed
      }
    } catch (error: any) {
      console.error('Error deleting investment:', error);
      
      // Show specific error message if available
      const errorMessage = error?.message || 'Failed to delete investment. Please try again.';
      alert(`Error: ${errorMessage}`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage > 0 ? '+' : ''}${percentage.toFixed(2)}%`;
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
      {/* Portfolio Summary */}
      {portfolioSummary && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Portfolio Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {formatCurrency(portfolioSummary.totalCurrentValue)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Value</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {formatCurrency(portfolioSummary.totalInvested)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Invested</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${portfolioSummary.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(portfolioSummary.totalReturn)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Return</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center">
                {portfolioSummary.returnPercentage >= 0 ? (
                  <ArrowTrendingUpIcon className="h-5 w-5 text-green-500 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="h-5 w-5 text-red-500 mr-1" />
                )}
                <p className={`text-2xl font-bold ${portfolioSummary.returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(portfolioSummary.returnPercentage)}
                </p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Return %</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Investment Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Investments ({investments.length})
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Investment
        </button>
      </div>

      {/* Add Investment Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Symbol *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., AAPL"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleSymbolSearch}
                    disabled={searchingSymbol || !formData.symbol}
                    className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-md"
                  >
                    {searchingSymbol ? 'Searching...' : 'Search'}
                  </button>
                </div>
                {symbolData && (
                  <div className="mt-2 p-2 bg-green-50 dark:bg-green-900 rounded text-sm">
                    <p className="font-medium">{symbolData.name}</p>
                    <p>Current Price: {formatCurrency(symbolData.price)}</p>
                    <p className={symbolData.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                      Today: {formatPercentage(symbolData.changePercent)}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  placeholder="Investment name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  required
                >
                  {INVESTMENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Purchase Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Purchase Date *
                </label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 dark:bg-gray-700 dark:text-white"
                rows={3}
                placeholder="Any additional notes..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setSymbolData(null);
                }}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Add Investment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Investments List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {investments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No investments yet. Add your first investment to start tracking your portfolio.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Symbol / Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Purchase Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Current Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Return
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {investments.map((investment) => (
                  <tr key={investment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {investment.symbol}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {investment.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {investment.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {investment.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(investment.purchasePrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {investment.currentValue ? formatCurrency(investment.currentValue) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {investment.totalReturn !== undefined ? (
                        <div className="flex items-center">
                          {investment.totalReturn >= 0 ? (
                            <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <span className={`text-sm font-medium ${
                            investment.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(investment.totalReturn)}
                          </span>
                          <span className={`text-xs ml-1 ${
                            (investment.returnPercentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ({formatPercentage(investment.returnPercentage || 0)})
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteInvestment(investment.id, investment.name)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete investment"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
