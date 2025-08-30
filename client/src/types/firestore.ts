// client/src/types/firestore.ts
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: Date;
  updatedAt: Date;
  financialProfile?: {
    monthlyIncome?: number;
    riskTolerance: 'low' | 'medium' | 'high';
    investmentGoals: string[];
    age?: number;
  };
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
  currentPrice: number;
  purchaseDate: Date;
  platform: string;
  type: 'stock' | 'etf' | 'mutual_fund' | 'crypto' | 'bond';
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
  category: 'emergency_fund' | 'retirement' | 'house' | 'education' | 'vacation' | 'other';
  priority: 'low' | 'medium' | 'high';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIRecommendation {
  id: string;
  userId: string;
  type: 'investment' | 'expense_optimization' | 'goal_adjustment' | 'budget_alert';
  title: string;
  description: string;
  confidence: number; // 0-1
  priority: 'low' | 'medium' | 'high';
  actionRequired: boolean;
  data?: any; // Additional recommendation data
  isRead: boolean;
  isImplemented: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

export interface Budget {
  id: string;
  userId: string;
  month: string; // YYYY-MM format
  categories: {
    [category: string]: {
      budgeted: number;
      spent: number;
      remaining: number;
    };
  };
  totalBudgeted: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}