# 🏦 NeoVest - Personal Finance Management System

[![Status](https://img.shields.io/badge/Status-Production%20Ready-green.svg)](.)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-00C7B7.svg)](.)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js-000000.svg)](.)
[![Database](https://img.shields.io/badge/Database-Firestore-FFA000.svg)](.)

A comprehensive personal finance management application with real-time investment tracking, expense management, budget planning, and AI-powered financial insights.

## ✨ Features

### 📊 Dashboard & Analytics
- **Financial Health Score**: Comprehensive scoring based on savings rate, emergency fund, expense control, and investment diversification
- **Real-time Portfolio**: Live investment tracking with current market prices
- **Expense Analysis**: Detailed spending categorization and trends
- **Budget Management**: Smart budgeting with spending alerts
- **Net Worth Tracking**: Complete asset and liability overview

### 💰 Investment Management
- **Multi-Asset Support**: Stocks, ETFs, Mutual Funds, Cryptocurrencies
- **Live Price Updates**: Real-time market data via Yahoo Finance
- **Portfolio Analytics**: Performance tracking, gains/losses, diversification metrics
- **Market Data**: Stock quotes, crypto prices, forex rates, market indices

### 💳 Expense Tracking
- **Smart Categorization**: Automatic expense categorization
- **Recurring Expenses**: Support for recurring payments
- **Payment Methods**: Track expenses across different payment methods
- **Tag System**: Custom tags for better organization

### 🎯 Financial Goals
- **Goal Setting**: Emergency funds, savings targets, investment goals
- **Progress Tracking**: Visual progress indicators
- **Smart Recommendations**: AI-powered goal suggestions
- **Priority Management**: Organize goals by priority

### 🤖 AI Recommendations
- **Personalized Insights**: AI-powered financial advice
- **Spending Optimization**: Smart spending recommendations
- **Investment Suggestions**: Portfolio optimization advice
- **Risk Assessment**: Personalized risk tolerance analysis

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18+ recommended)
- **Python** (v3.9+ recommended) 
- **Firebase Account** (for authentication and database)

### 1. Clone Repository
```bash
git clone <repository-url>
cd NeoVest
```

### 2. Setup Backend
```bash
cd server
pip install -r requirements.txt

# Setup Firebase credentials
cp .env.example .env
# Add your Firebase service account credentials to .env

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Setup Frontend
```bash
cd client
npm install

# Setup environment variables
cp .env.local.example .env.local
# Add your Firebase client configuration to .env.local

# Start frontend server
npm run dev
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🏗️ Architecture

### Backend (FastAPI)
```
server/
├── app/
│   ├── main.py              # Complete FastAPI application with all endpoints
│   └── .env                 # Environment variables (Firebase config)
└── requirements.txt         # Python dependencies
```

### Frontend (Next.js)
```
client/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/          # React components
│   │   ├── auth/            # Authentication components
│   │   ├── dashboard/       # Dashboard components
│   │   ├── expenses/        # Expense tracking
│   │   ├── investments/     # Investment management
│   │   ├── health/          # Financial health
│   │   └── budget/          # Budget components
│   ├── lib/                 # Utility libraries
│   │   ├── firebaseAuth.ts  # Firebase authentication
│   │   ├── firebaseClient.ts # Firebase client config
│   │   └── firestoreService.ts # Database operations
│   └── types/               # TypeScript types
│       └── firestore.ts     # Firestore data models
└── package.json             # Node.js dependencies
```

## 📋 API Endpoints

### Authentication Required Endpoints
All endpoints below require Firebase JWT token in Authorization header:
```
Authorization: Bearer <firebase-jwt-token>
```

### 💰 Investment Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/investments` | Create new investment |
| `GET` | `/api/investments` | Get all investments with live pricing |
| `PUT` | `/api/investments/{id}` | Update investment |
| `DELETE` | `/api/investments/{id}` | Delete investment |
| `GET` | `/api/investments/portfolio-summary` | Get portfolio performance |

### 💳 Expense Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/expenses` | Create new expense |
| `GET` | `/api/expenses` | Get all expenses |
| `PUT` | `/api/expenses/{id}` | Update expense |
| `DELETE` | `/api/expenses/{id}` | Delete expense |

### 💰 Budget Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/budgets` | Create budget |
| `GET` | `/api/budgets` | Get budgets with spending analysis |
| `PUT` | `/api/budgets/{id}` | Update budget |
| `DELETE` | `/api/budgets/{id}` | Delete budget |

### 🎯 Financial Goals Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/goals` | Create financial goal |
| `GET` | `/api/goals` | Get all goals |
| `PUT` | `/api/goals/{id}` | Update goal |
| `DELETE` | `/api/goals/{id}` | Delete goal |
| `PUT` | `/api/goals/{id}/progress` | Update goal progress |

### 📊 Analytics Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/financial-health` | Get financial health score |
| `GET` | `/api/analytics/spending-overview` | Get spending overview |
| `GET` | `/api/analytics/income-expense` | Get income vs expense trends |
| `GET` | `/api/analytics/net-worth` | Get net worth calculation |

### 📈 Market Data Endpoints (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/market/stocks/{symbol}` | Get stock data |
| `GET` | `/api/market/stocks/{symbol}/history` | Get stock price history |
| `GET` | `/api/market/crypto` | Get crypto prices |
| `GET` | `/api/market/forex` | Get forex rates |
| `GET` | `/api/market/indices` | Get market indices |

### 🤖 AI Recommendations
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/recommendations` | Get AI recommendations |
| `POST` | `/api/recommendations/generate` | Generate new recommendations |
| `POST` | `/api/recommendations/mark-read/{id}` | Mark recommendation as read |

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Enable Authentication with Email/Password
4. Generate service account key for backend
5. Get web app config for frontend

### Backend Environment Variables
```env
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
```

### Frontend Environment Variables
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📊 Database Schema

### Firestore Collections

#### Users
```typescript
{
  uid: string;
  email: string;
  displayName?: string;
  monthlyIncome?: number;
  riskTolerance?: string;
  age?: number;
  investmentGoals?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Expenses
```typescript
{
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: Timestamp;
  paymentMethod: string;
  tags: string[];
  isRecurring: boolean;
  recurringFrequency?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Investments
```typescript
{
  userId: string;
  symbol: string;
  name: string;
  type: string; // 'stock' | 'etf' | 'mutual_fund' | 'crypto'
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Financial Goals
```typescript
{
  userId: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Timestamp;
  category: string; // 'emergency_fund' | 'savings' | 'investment' | 'debt_payoff'
  priority: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 🔒 Security

- **Firebase Authentication**: Secure user authentication and authorization
- **JWT Tokens**: Stateless authentication with Firebase ID tokens
- **Role-Based Access**: User data isolation and access control
- **Input Validation**: Comprehensive input validation with Pydantic models
- **CORS Configuration**: Proper CORS setup for frontend-backend communication

## 🧪 Development

### Running Tests
```bash
# Backend tests
cd server
python -m pytest

# Frontend tests  
cd client
npm test
```

### Code Quality
```bash
# Backend linting
cd server
flake8 app/
black app/

# Frontend linting
cd client
npm run lint
npm run type-check
```

## 🚀 Deployment

### Backend Deployment
- Deploy on platforms like Railway, Render, or AWS
- Set environment variables in deployment platform
- Ensure Firestore security rules are configured

### Frontend Deployment
- Deploy on Vercel, Netlify, or similar platforms
- Set environment variables in deployment platform
- Configure build settings for Next.js

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@neovest.com or create an issue in the repository.

## 📈 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced AI insights
- [ ] Tax optimization features
- [ ] Integration with bank APIs
- [ ] Social features and challenges
- [ ] Advanced portfolio analytics
- [ ] Retirement planning tools

---

**Made with ❤️ for better financial management**
