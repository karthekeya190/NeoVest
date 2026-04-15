// client/src/types/firestore.ts
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: Date;
  updatedAt: Date;
  monthlyIncome?: number;
  riskTolerance?: 'low' | 'medium' | 'high';
  investmentGoals?: string[];
  age?: number;
  additionalAssets?: number;
  liabilities?: number;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer';
  tags?: string[];
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdAt: Date;
  updatedAt: Date;
}

export interface Investment {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice?: number;
  purchaseDate: Date;
  exchange?: string;
  notes?: string;
  type: 'stocks' | 'crypto' | 'bonds' | 'etf' | 'mutual_fund';
  currentValue?: number;
  totalReturn?: number;
  returnPercentage?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialGoal {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  category: string;
  priority: 'low' | 'medium' | 'high';
  progress?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  alertThreshold: number;
  spentAmount?: number;
  remainingAmount?: number;
  spentPercentage?: number;
  isOverBudget?: boolean;
  isNearAlert?: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIRecommendation {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  actionable: boolean;
  suggestedAction?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  pe?: number;
  dividend?: number;
  currency?: string;
  exchange?: string;
}

export interface PortfolioSummary {
  totalCurrentValue: number;
  totalInvested: number;
  totalReturn: number;
  returnPercentage: number;
  byType: { [key: string]: {
    count: number;
    invested: number;
    currentValue: number;
    return: number;
    returnPercent: number;
  }};
}

export interface FinancialHealth {
  healthScore: number;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor';
  healthMessage: string;
  metrics: {
    savingsRate: number;
    expenseRatio: number;
    emergencyFundMonths: number;
    investmentCount: number;
    investmentTypes: number;
  };
  factors: Array<{
    factor: string;
    points: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
  }>;
  recommendations: string[];
}