# server/app/main.py
from fastapi import FastAPI, HTTPException, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import credentials, auth, firestore
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

import json


# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

# Initialize Firebase Admin SDK
def initialize_firebase():
    if not firebase_admin._apps:
        # Check if Firebase environment variables exist
        firebase_private_key = os.getenv("FIREBASE_PRIVATE_KEY")
        if not firebase_private_key:
            print("Firebase environment variables not found. Available env vars:")
            print([key for key in os.environ.keys() if 'FIREBASE' in key])
            raise ValueError("FIREBASE_PRIVATE_KEY not found in environment variables")
            
        cred_dict = {
            "type": "service_account",
            "project_id": os.getenv("FIREBASE_PROJECT_ID"),
            "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
            "private_key": firebase_private_key.replace('\\n', '\n'),
            "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
            "client_id": os.getenv("FIREBASE_CLIENT_ID"),
            "auth_uri": os.getenv("FIREBASE_AUTH_URI"),
            "token_uri": os.getenv("FIREBASE_TOKEN_URI"),
        }
        
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        print("Firebase initialized successfully!")

initialize_firebase()

# Get Firestore client
db = firestore.client()

app = FastAPI(
    title="NeoVest API",
    description="An intelligent finance assistant API with Firestore - All financial data in Indian Rupees (INR)",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Pydantic Models
class ExpenseCreate(BaseModel):
    amount: float  # Amount in INR
    category: str
    description: str
    date: str  # ISO format
    paymentMethod: str
    tags: Optional[List[str]] = []
    isRecurring: Optional[bool] = False
    recurringFrequency: Optional[str] = None
    currency: str = "INR"  # Default to INR

class ExpenseUpdate(BaseModel):
    amount: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    paymentMethod: Optional[str] = None
    tags: Optional[List[str]] = None
    isRecurring: Optional[bool] = None
    recurringFrequency: Optional[str] = None

class FinancialGoalCreate(BaseModel):
    title: str
    description: str
    targetAmount: float  # Amount in INR
    currentAmount: float = 0  # Amount in INR
    targetDate: str  # ISO format
    category: str
    priority: str
    currency: str = "INR"  # Default to INR

class FinancialGoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    targetAmount: Optional[float] = None
    currentAmount: Optional[float] = None
    targetDate: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None

class InvestmentCreate(BaseModel):
    symbol: str
    name: str
    type: str  # stocks, crypto, bonds, etc.
    quantity: float
    purchasePrice: float  # Amount in INR
    purchaseDate: str  # ISO format
    exchange: Optional[str] = None
    notes: Optional[str] = None
    currency: str = "INR"  # Default to INR

class InvestmentUpdate(BaseModel):
    quantity: Optional[float] = None
    purchasePrice: Optional[float] = None  # Amount in INR
    purchaseDate: Optional[str] = None
    notes: Optional[str] = None

class BudgetCreate(BaseModel):
    category: str
    amount: float  # Amount in INR
    period: str  # monthly, weekly, yearly
    startDate: str  # ISO format
    endDate: str  # ISO format
    alertThreshold: Optional[float] = 80.0  # percentage
    currency: str = "INR"  # Default to INR

class BudgetUpdate(BaseModel):
    amount: Optional[float] = None
    period: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    alertThreshold: Optional[float] = None

class UserProfileUpdate(BaseModel):
    displayName: Optional[str] = None
    monthlyIncome: Optional[float] = None
    riskTolerance: Optional[str] = None
    investmentGoals: Optional[List[str]] = []
    age: Optional[int] = None

async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify Firebase JWT token"""
    try:
        token = credentials.credentials
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

@app.get("/")
def read_root():
    return {"message": "NeoVest API with Firestore is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "firestore"}

# Currency conversion utilities
async def get_usd_to_inr_rate():
    """Get current USD to INR exchange rate"""
    try:
        import requests
        forex_url = "https://api.exchangerate-api.com/v4/latest/USD"
        response = requests.get(forex_url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            return data.get('rates', {}).get('INR', 83.0)
        return 83.0  # Fallback rate
    except:
        return 83.0  # Fallback rate

def convert_usd_to_inr(amount_usd, exchange_rate=83.0):
    """Convert USD amount to INR"""
    return amount_usd * exchange_rate

def format_inr_currency(amount):
    """Format amount as INR currency"""
    return f"₹{amount:,.2f}"

# User Profile Endpoints
@app.get("/api/user/profile")
async def get_user_profile(user: dict = Depends(verify_firebase_token)):
    """Get user profile from Firestore"""
    try:
        user_ref = db.collection('users').document(user['uid'])
        user_doc = user_ref.get()
        
        if user_doc.exists:
            profile_data = user_doc.to_dict()
            return {
                "uid": user['uid'],
                "email": user.get('email'),
                **profile_data
            }
        else:
            # Create new user profile
            profile_data = {
                "uid": user['uid'],
                "email": user.get('email'),
                "createdAt": firestore.SERVER_TIMESTAMP,
                "updatedAt": firestore.SERVER_TIMESTAMP
            }
            user_ref.set(profile_data)
            return profile_data
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user profile: {str(e)}")

@app.put("/api/user/profile")
async def update_user_profile(
    profile_update: UserProfileUpdate,
    user: dict = Depends(verify_firebase_token)
):
    """Update user profile in Firestore"""
    try:
        user_ref = db.collection('users').document(user['uid'])
        
        update_data = profile_update.model_dump(exclude_unset=True)
        update_data['updatedAt'] = firestore.SERVER_TIMESTAMP
        
        user_ref.update(update_data)
        return {"message": "Profile updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating profile: {str(e)}")

# Expense Endpoints
@app.post("/api/expenses")
async def create_expense(
    expense: ExpenseCreate,
    user: dict = Depends(verify_firebase_token)
):
    """Create new expense in Firestore"""
    try:
        expenses_ref = db.collection('expenses')
        
        expense_data = {
            "userId": user['uid'],
            "amount": expense.amount,
            "category": expense.category,
            "description": expense.description,
            "date": datetime.fromisoformat(expense.date.replace('Z', '+00:00')),
            "paymentMethod": expense.paymentMethod,
            "tags": expense.tags or [],
            "isRecurring": expense.isRecurring,
            "recurringFrequency": expense.recurringFrequency,
            "currency": "INR",  # All expenses stored in INR
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP
        }
        
        doc_ref = expenses_ref.add(expense_data)
        return {"message": "Expense created successfully", "expense_id": doc_ref[1].id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating expense: {str(e)}")

@app.put("/api/expenses/{expense_id}")
async def update_expense(
    expense_id: str,
    expense_update: ExpenseUpdate,
    user: dict = Depends(verify_firebase_token)
):
    """Update an existing expense"""
    try:
        expense_ref = db.collection('expenses').document(expense_id)
        expense_doc = expense_ref.get()
        
        if not expense_doc.exists:
            raise HTTPException(status_code=404, detail="Expense not found")
        
        expense_data = expense_doc.to_dict()
        if expense_data['userId'] != user['uid']:
            raise HTTPException(status_code=403, detail="Not authorized to update this expense")
        
        update_data = expense_update.model_dump(exclude_unset=True)
        if 'date' in update_data:
            update_data['date'] = datetime.fromisoformat(update_data['date'].replace('Z', '+00:00'))
        update_data['updatedAt'] = firestore.SERVER_TIMESTAMP
        
        expense_ref.update(update_data)
        return {"message": "Expense updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating expense: {str(e)}")

@app.delete("/api/expenses/{expense_id}")
async def delete_expense(
    expense_id: str,
    user: dict = Depends(verify_firebase_token)
):
    """Delete an expense"""
    try:
        expense_ref = db.collection('expenses').document(expense_id)
        expense_doc = expense_ref.get()
        
        if not expense_doc.exists:
            raise HTTPException(status_code=404, detail="Expense not found")
        
        expense_data = expense_doc.to_dict()
        if expense_data['userId'] != user['uid']:
            raise HTTPException(status_code=403, detail="Not authorized to delete this expense")
        
        expense_ref.delete()
        return {"message": "Expense deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting expense: {str(e)}")

@app.get("/api/expenses")
async def get_expenses(user: dict = Depends(verify_firebase_token)):
    """Get user expenses from Firestore"""
    try:
        expenses_ref = db.collection('expenses')
        query = expenses_ref.where('userId', '==', user['uid']).order_by('date', direction=firestore.Query.DESCENDING).limit(100)
        
        docs = query.stream()
        expenses = []
        
        for doc in docs:
            expense_data = doc.to_dict()
            expense_data['id'] = doc.id
            # Convert Firestore timestamp to ISO string for frontend
            if 'date' in expense_data and expense_data['date']:
                expense_data['date'] = expense_data['date'].isoformat()
            expenses.append(expense_data)
        
        return {"expenses": expenses}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching expenses: {str(e)}")

# Financial Goals Endpoints
@app.post("/api/goals")
async def create_financial_goal(
    goal: FinancialGoalCreate,
    user: dict = Depends(verify_firebase_token)
):
    """Create new financial goal"""
    try:
        goals_ref = db.collection('financial_goals')
        
        goal_data = {
            "userId": user['uid'],
            "title": goal.title,
            "description": goal.description,
            "targetAmount": goal.targetAmount,
            "currentAmount": goal.currentAmount,
            "targetDate": datetime.fromisoformat(goal.targetDate.replace('Z', '+00:00')),
            "category": goal.category,
            "priority": goal.priority,
            "currency": "INR",  # All goals stored in INR
            "isActive": True,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP
        }
        
        doc_ref = goals_ref.add(goal_data)
        return {"message": "Financial goal created successfully", "goal_id": doc_ref[1].id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating goal: {str(e)}")

@app.get("/api/goals")
async def get_financial_goals(user: dict = Depends(verify_firebase_token)):
    """Get user financial goals"""
    try:
        goals_ref = db.collection('financial_goals')
        query = goals_ref.where('userId', '==', user['uid']).where('isActive', '==', True)
        
        docs = query.stream()
        goals = []
        
        for doc in docs:
            goal_data = doc.to_dict()
            goal_data['id'] = doc.id
            # Calculate progress percentage
            progress = (goal_data['currentAmount'] / goal_data['targetAmount']) * 100
            goal_data['progress'] = min(progress, 100)
            goals.append(goal_data)
        
        return {"goals": goals}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching goals: {str(e)}")

@app.put("/api/goals/{goal_id}")
async def update_financial_goal(
    goal_id: str,
    goal_update: FinancialGoalUpdate,
    user: dict = Depends(verify_firebase_token)
):
    """Update an existing financial goal"""
    try:
        goal_ref = db.collection('financial_goals').document(goal_id)
        goal_doc = goal_ref.get()
        
        if not goal_doc.exists:
            raise HTTPException(status_code=404, detail="Financial goal not found")
        
        goal_data = goal_doc.to_dict()
        if goal_data['userId'] != user['uid']:
            raise HTTPException(status_code=403, detail="Not authorized to update this goal")
        
        update_data = goal_update.model_dump(exclude_unset=True)
        if 'targetDate' in update_data:
            update_data['targetDate'] = datetime.fromisoformat(update_data['targetDate'].replace('Z', '+00:00'))
        update_data['updatedAt'] = firestore.SERVER_TIMESTAMP
        
        goal_ref.update(update_data)
        return {"message": "Financial goal updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating goal: {str(e)}")

@app.delete("/api/goals/{goal_id}")
async def delete_financial_goal(
    goal_id: str,
    user: dict = Depends(verify_firebase_token)
):
    """Delete a financial goal (soft delete)"""
    try:
        goal_ref = db.collection('financial_goals').document(goal_id)
        goal_doc = goal_ref.get()
        
        if not goal_doc.exists:
            raise HTTPException(status_code=404, detail="Financial goal not found")
        
        goal_data = goal_doc.to_dict()
        if goal_data['userId'] != user['uid']:
            raise HTTPException(status_code=403, detail="Not authorized to delete this goal")
        
        goal_ref.update({
            'isActive': False,
            'updatedAt': firestore.SERVER_TIMESTAMP
        })
        return {"message": "Financial goal deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting goal: {str(e)}")

@app.put("/api/goals/{goal_id}/progress")
async def update_goal_progress(
    goal_id: str,
    progress_data: dict = Body(...),
    user: dict = Depends(verify_firebase_token)
):
    """Update goal progress"""
    try:
        goal_ref = db.collection('financial_goals').document(goal_id)
        goal_doc = goal_ref.get()
        
        if not goal_doc.exists:
            raise HTTPException(status_code=404, detail="Financial goal not found")
        
        goal_data = goal_doc.to_dict()
        if goal_data['userId'] != user['uid']:
            raise HTTPException(status_code=403, detail="Not authorized to update this goal")
        
        current_amount = progress_data.get('currentAmount')
        if current_amount is None:
            raise HTTPException(status_code=400, detail="currentAmount is required")
        
        goal_ref.update({
            'currentAmount': current_amount,
            'updatedAt': firestore.SERVER_TIMESTAMP
        })
        
        return {"message": "Goal progress updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating goal progress: {str(e)}")

# AI Recommendations Endpoints
@app.get("/api/recommendations")
async def get_ai_recommendations(
    unread_only: bool = False,
    user: dict = Depends(verify_firebase_token)
):
    """Get AI recommendations for user"""
    try:
        recommendations_ref = db.collection('ai_recommendations')
        query = recommendations_ref.where('userId', '==', user['uid']).order_by('createdAt', direction=firestore.Query.DESCENDING).limit(10)
        
        if unread_only:
            query = query.where('isRead', '==', False)
        
        docs = query.stream()
        recommendations = []
        
        for doc in docs:
            rec_data = doc.to_dict()
            rec_data['id'] = doc.id
            recommendations.append(rec_data)
        
        return {"recommendations": recommendations}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recommendations: {str(e)}")

@app.post("/api/recommendations/mark-read/{recommendation_id}")
async def mark_recommendation_read(
    recommendation_id: str,
    user: dict = Depends(verify_firebase_token)
):
    """Mark recommendation as read"""
    try:
        rec_ref = db.collection('ai_recommendations').document(recommendation_id)
        rec_doc = rec_ref.get()
        
        if not rec_doc.exists:
            raise HTTPException(status_code=404, detail="Recommendation not found")
        
        rec_data = rec_doc.to_dict()
        if rec_data['userId'] != user['uid']:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        rec_ref.update({
            'isRead': True,
            'readAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP
        })
        
        return {"message": "Recommendation marked as read"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error marking recommendation: {str(e)}")

@app.post("/api/recommendations/generate")
async def generate_recommendations(user: dict = Depends(verify_firebase_token)):
    """Generate new AI recommendations based on user data"""
    try:
        # Fetch user's financial data
        expenses_ref = db.collection('expenses')
        expenses_query = expenses_ref.where('userId', '==', user['uid']).order_by('date', direction=firestore.Query.DESCENDING).limit(100)
        
        goals_ref = db.collection('financial_goals')
        goals_query = goals_ref.where('userId', '==', user['uid']).where('isActive', '==', True)
        
        investments_ref = db.collection('investments')
        investments_query = investments_ref.where('userId', '==', user['uid']).where('isActive', '==', True)
        
        # Analyze spending patterns
        expenses = []
        for doc in expenses_query.stream():
            expenses.append(doc.to_dict())
        
        goals = []
        for doc in goals_query.stream():
            goals.append(doc.to_dict())
        
        investments = []
        for doc in investments_query.stream():
            investments.append(doc.to_dict())
        
        # Generate recommendations based on analysis
        recommendations = []
        
        # Spending analysis
        if expenses:
            category_totals = {}
            total_spending = 0
            for expense in expenses[-30:]:  # Last 30 expenses
                category = expense['category']
                amount = expense['amount']
                total_spending += amount
                category_totals[category] = category_totals.get(category, 0) + amount
            
            # Check for overspending in categories
            for category, amount in category_totals.items():
                if amount > total_spending * 0.3:  # More than 30% in one category
                    recommendations.append({
                        "type": "spending_alert",
                        "title": f"High Spending in {category}",
                        "description": f"You've spent ₹{amount:.2f} on {category}, which is {amount/total_spending*100:.1f}% of your recent spending. Consider setting a budget for this category.",
                        "priority": "high",
                        "category": "budget",
                        "actionable": True,
                        "suggestedAction": f"Set a monthly budget of ₹{amount*0.8:.2f} for {category}"
                    })
        
        # Investment diversification
        if investments:
            investment_types = {}
            for investment in investments:
                inv_type = investment['type']
                investment_types[inv_type] = investment_types.get(inv_type, 0) + 1
            
            if len(investment_types) < 3:
                recommendations.append({
                    "type": "diversification",
                    "title": "Diversify Your Portfolio",
                    "description": "Your portfolio could benefit from more diversification. Consider adding different asset classes to reduce risk.",
                    "priority": "medium",
                    "category": "investment",
                    "actionable": True,
                    "suggestedAction": "Add bonds or ETFs to balance your stock portfolio"
                })
        
        # Emergency fund check
        if not any(goal['category'] == 'emergency_fund' for goal in goals):
            recommendations.append({
                "type": "emergency_fund",
                "title": "Build an Emergency Fund",
                "description": "Consider creating an emergency fund to cover 3-6 months of expenses for financial security.",
                "priority": "high",
                "category": "savings",
                "actionable": True,
                "suggestedAction": "Start with a goal of ₹75,000 emergency fund"
            })
        
        # Save recommendations to database
        recommendations_ref = db.collection('ai_recommendations')
        saved_recommendations = []
        
        for rec in recommendations:
            rec_data = {
                "userId": user['uid'],
                **rec,
                "isRead": False,
                "createdAt": firestore.SERVER_TIMESTAMP,
                "updatedAt": firestore.SERVER_TIMESTAMP
            }
            doc_ref = recommendations_ref.add(rec_data)
            rec_data['id'] = doc_ref[1].id
            saved_recommendations.append(rec_data)
        
        return {
            "message": f"Generated {len(recommendations)} new recommendations",
            "recommendations": saved_recommendations
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")

# Enhanced Analytics Endpoints
@app.get("/api/analytics/spending-overview")
async def get_spending_overview(
    days: int = 30,
    user: dict = Depends(verify_firebase_token)
):
    """Get spending overview for the last N days"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        expenses_ref = db.collection('expenses')
        query = expenses_ref.where('userId', '==', user['uid']).where('date', '>=', start_date).where('date', '<=', end_date)
        
        docs = query.stream()
        
        total_spent = 0
        category_totals = {}
        daily_spending = {}
        payment_method_totals = {}
        
        for doc in docs:
            expense_data = doc.to_dict()
            amount = expense_data['amount']
            category = expense_data['category']
            payment_method = expense_data.get('paymentMethod', 'unknown')
            date_str = expense_data['date'].strftime('%Y-%m-%d')
            
            total_spent += amount
            
            # Category totals
            category_totals[category] = category_totals.get(category, 0) + amount
            
            # Daily spending
            daily_spending[date_str] = daily_spending.get(date_str, 0) + amount
            
            # Payment method totals
            payment_method_totals[payment_method] = payment_method_totals.get(payment_method, 0) + amount
        
        return {
            "totalSpent": total_spent,
            "averageDaily": total_spent / days,
            "categoryBreakdown": category_totals,
            "dailySpending": daily_spending,
            "paymentMethodBreakdown": payment_method_totals,
            "period": f"{days} days"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating analytics: {str(e)}")

@app.get("/api/analytics/income-expense")
async def get_income_expense_trends(
    months: int = 6,
    user: dict = Depends(verify_firebase_token)
):
    """Get income vs expense trends"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months * 30)
        
        expenses_ref = db.collection('expenses')
        query = expenses_ref.where('userId', '==', user['uid']).where('date', '>=', start_date).where('date', '<=', end_date)
        
        # Get user profile for income data
        user_ref = db.collection('users').document(user['uid'])
        user_doc = user_ref.get()
        monthly_income = 0
        if user_doc.exists:
            user_data = user_doc.to_dict()
            monthly_income = user_data.get('monthlyIncome', 0)
        
        docs = query.stream()
        monthly_expenses = {}
        
        for doc in docs:
            expense_data = doc.to_dict()
            amount = expense_data['amount']
            expense_date = expense_data['date']
            month_key = expense_date.strftime('%Y-%m')
            
            monthly_expenses[month_key] = monthly_expenses.get(month_key, 0) + amount
        
        # Calculate trends
        trends = []
        current_date = start_date
        while current_date <= end_date:
            month_key = current_date.strftime('%Y-%m')
            expenses = monthly_expenses.get(month_key, 0)
            savings = monthly_income - expenses
            savings_rate = (savings / monthly_income * 100) if monthly_income > 0 else 0
            
            trends.append({
                "month": month_key,
                "income": monthly_income,
                "expenses": expenses,
                "savings": savings,
                "savingsRate": round(savings_rate, 2)
            })
            
            # Move to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        return {"trends": trends}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating income-expense trends: {str(e)}")

@app.get("/api/analytics/net-worth")
async def get_net_worth(user: dict = Depends(verify_firebase_token)):
    """Calculate user's net worth"""
    try:
        # Get investments
        investments_ref = db.collection('investments')
        investments_query = investments_ref.where('userId', '==', user['uid']).where('isActive', '==', True)
        
        total_investments = 0
        for doc in investments_query.stream():
            investment = doc.to_dict()
            current_value = investment['quantity'] * investment['purchasePrice'] * 1.1  # Mock current price
            total_investments += current_value
        
        # Get goals (savings)
        goals_ref = db.collection('financial_goals')
        goals_query = goals_ref.where('userId', '==', user['uid']).where('isActive', '==', True)
        
        total_savings = 0
        for doc in goals_query.stream():
            goal = doc.to_dict()
            total_savings += goal.get('currentAmount', 0)
        
        # Get user profile for additional assets/liabilities
        user_ref = db.collection('users').document(user['uid'])
        user_doc = user_ref.get()
        
        additional_assets = 0
        liabilities = 0
        
        if user_doc.exists:
            user_data = user_doc.to_dict()
            additional_assets = user_data.get('additionalAssets', 0)
            liabilities = user_data.get('liabilities', 0)
        
        total_assets = total_investments + total_savings + additional_assets
        net_worth = total_assets - liabilities
        
        return {
            "netWorth": round(net_worth, 2),
            "totalAssets": round(total_assets, 2),
            "totalLiabilities": round(liabilities, 2),
            "breakdown": {
                "investments": round(total_investments, 2),
                "savings": round(total_savings, 2),
                "additionalAssets": round(additional_assets, 2),
                "liabilities": round(liabilities, 2)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating net worth: {str(e)}")

@app.get("/api/analytics/financial-health")
async def get_financial_health_score(user: dict = Depends(verify_firebase_token)):
    """Calculate financial health score"""
    try:
        print(f"Financial health calculation for user: {user['uid']}")
        
        # Get recent expenses (last 3 months)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=90)
        print(f"Date range: {start_date} to {end_date}")
        
        expenses_ref = db.collection('expenses')
        
        # First, try to get any expenses for this user to debug
        user_expenses_query = expenses_ref.where('userId', '==', user['uid'])
        all_expenses = []
        try:
            all_expense_docs = user_expenses_query.stream()
            for doc in all_expense_docs:
                all_expenses.append(doc.to_dict())
            print(f"Total expenses found for user: {len(all_expenses)}")
            
            if all_expenses:
                print("Sample expense dates:")
                for i, expense in enumerate(all_expenses[:3]):
                    print(f"  Expense {i+1}: {expense.get('date', 'No date')} - Amount: {expense.get('amount', 0)}")
        except Exception as e:
            print(f"Error fetching all expenses: {e}")
        
        # Filter expenses by date range (avoiding composite index requirement)
        total_expenses = 0
        expense_count_in_range = 0
        
        try:
            # Filter all_expenses by date range in Python
            for expense in all_expenses:
                expense_date = expense.get('date')
                if expense_date:
                    # Convert Firestore timestamp to datetime if needed
                    if hasattr(expense_date, 'timestamp'):
                        expense_datetime = datetime.fromtimestamp(expense_date.timestamp())
                    else:
                        expense_datetime = expense_date
                    
                    # Check if expense is in date range
                    if start_date <= expense_datetime <= end_date:
                        amount = expense.get('amount', 0)
                        total_expenses += amount
                        expense_count_in_range += 1
                        print(f"Expense in range: {amount} on {expense_datetime}")
                        
        except Exception as e:
            print(f"Error filtering expenses by date: {e}")
            # If there's an issue with expense data, set to 0 and continue
            total_expenses = 0
        
        print(f"Total expenses in last 90 days: {total_expenses} (count: {expense_count_in_range})")
        
        monthly_expenses = total_expenses / 3  # Average monthly expenses
        print(f"Monthly expenses: {monthly_expenses}")
        
        # Get user income
        user_ref = db.collection('users').document(user['uid'])
        user_doc = user_ref.get()
        monthly_income = 0
        if user_doc.exists:
            user_data = user_doc.to_dict()
            monthly_income = user_data.get('monthlyIncome', 0)
        
        print(f"Monthly income: {monthly_income}")
        
        # Calculate metrics
        savings_rate = ((monthly_income - monthly_expenses) / monthly_income * 100) if monthly_income > 0 else 0
        expense_ratio = (monthly_expenses / monthly_income * 100) if monthly_income > 0 else 100
        
        # Get emergency fund status
        goals_ref = db.collection('financial_goals')
        emergency_fund_goal = 0
        emergency_fund_current = 0
        
        goals_query = goals_ref.where('userId', '==', user['uid']).where('category', '==', 'emergency_fund').where('isActive', '==', True)
        for doc in goals_query.stream():
            goal = doc.to_dict()
            emergency_fund_goal = goal.get('targetAmount', 0)
            emergency_fund_current = goal.get('currentAmount', 0)
        
        emergency_fund_months = (emergency_fund_current / monthly_expenses) if monthly_expenses > 0 else 0
        
        # Calculate health score (0-100)
        score = 0
        factors = []
        
        print(f"Calculating score components:")
        print(f"Savings rate: {savings_rate}%")
        print(f"Expense ratio: {expense_ratio}%") 
        print(f"Emergency fund months: {emergency_fund_months}")
        
        # Savings rate (30 points)
        if savings_rate >= 20:
            score += 30
            factors.append({"factor": "Excellent savings rate", "points": 30, "status": "excellent"})
        elif savings_rate >= 10:
            score += 20
            factors.append({"factor": "Good savings rate", "points": 20, "status": "good"})
        elif savings_rate >= 0:
            score += 10
            factors.append({"factor": "Basic savings rate", "points": 10, "status": "fair"})
        else:
            factors.append({"factor": "Negative savings rate", "points": 0, "status": "poor"})
            
        # If no income data, give partial credit for having a profile
        if monthly_income == 0:
            factors.append({"factor": "No income data - please update your profile", "points": 0, "status": "poor"})
        
        # Emergency fund (25 points)
        if emergency_fund_months >= 6:
            score += 25
            factors.append({"factor": "Strong emergency fund", "points": 25, "status": "excellent"})
        elif emergency_fund_months >= 3:
            score += 20
            factors.append({"factor": "Adequate emergency fund", "points": 20, "status": "good"})
        elif emergency_fund_months >= 1:
            score += 10
            factors.append({"factor": "Basic emergency fund", "points": 10, "status": "fair"})
        else:
            factors.append({"factor": "No emergency fund", "points": 0, "status": "poor"})
        
        # Expense management (25 points)
        if monthly_expenses == 0:
            # If no expenses recorded, give partial credit
            score += 5
            factors.append({"factor": "No expense data - start tracking expenses", "points": 5, "status": "fair"})
        elif expense_ratio <= 50:
            score += 25
            factors.append({"factor": "Excellent expense control", "points": 25, "status": "excellent"})
        elif expense_ratio <= 70:
            score += 20
            factors.append({"factor": "Good expense control", "points": 20, "status": "good"})
        elif expense_ratio <= 90:
            score += 10
            factors.append({"factor": "Fair expense control", "points": 10, "status": "fair"})
        else:
            factors.append({"factor": "Poor expense control", "points": 0, "status": "poor"})
        
        print(f"Score after expense management: {score}")
        
        # Investment diversification (20 points)
        investments_ref = db.collection('investments')
        investments_query = investments_ref.where('userId', '==', user['uid']).where('isActive', '==', True)
        
        investment_types = set()
        investment_count = 0
        try:
            for doc in investments_query.stream():
                investment = doc.to_dict()
                investment_types.add(investment['type'])
                investment_count += 1
                print(f"Investment found: {investment['symbol']} ({investment['type']}) - Qty: {investment['quantity']}")
        except Exception as e:
            print(f"Error processing investments: {e}")
        
        print(f"Total investments found: {investment_count}, Types: {list(investment_types)}")
        
        if len(investment_types) >= 3 and investment_count >= 5:
            score += 20
            factors.append({"factor": "Well diversified portfolio", "points": 20, "status": "excellent"})
        elif len(investment_types) >= 2 and investment_count >= 3:
            score += 15
            factors.append({"factor": "Moderately diversified portfolio", "points": 15, "status": "good"})
        elif investment_count >= 1:
            score += 5
            factors.append({"factor": "Basic investment portfolio", "points": 5, "status": "fair"})
        else:
            factors.append({"factor": "No investments", "points": 0, "status": "poor"})
        
        print(f"Investment count: {investment_count}")
        print(f"Investment types: {len(investment_types)}")
        print(f"Final score: {score}")
        print(f"All factors: {factors}")
        
        # Determine overall health status
        if score >= 80:
            health_status = "excellent"
            health_message = "Your financial health is excellent! Keep up the great work."
        elif score >= 60:
            health_status = "good"
            health_message = "Your financial health is good. Consider improving in a few areas."
        elif score >= 40:
            health_status = "fair"
            health_message = "Your financial health is fair. Focus on building emergency funds and reducing expenses."
        else:
            health_status = "poor"
            health_message = "Your financial health needs attention. Start with budgeting and building an emergency fund."
        
        return {
            "healthScore": round(score, 1),
            "healthStatus": health_status,
            "healthMessage": health_message,
            "metrics": {
                "savingsRate": round(savings_rate, 1),
                "expenseRatio": round(expense_ratio, 1),
                "emergencyFundMonths": round(emergency_fund_months, 1),
                "investmentCount": investment_count,
                "investmentTypes": len(investment_types)
            },
            "factors": factors,
            "recommendations": [rec for rec in [
                "Set your monthly income in your profile to get better health insights" if monthly_income == 0 else None,
                "Start tracking expenses to improve your financial health score" if monthly_expenses == 0 else None,
                "Increase your savings rate to at least 20%" if savings_rate < 20 and monthly_income > 0 else None,
                "Create an emergency fund goal covering 6 months of expenses" if emergency_fund_months < 6 else None,
                "Reduce monthly expenses below 70% of income" if expense_ratio > 70 and monthly_income > 0 else None,
                "Add more investment types to diversify your portfolio" if len(investment_types) < 3 and investment_count > 0 else None,
                "Start investing to improve your financial health" if investment_count == 0 else None
            ] if rec is not None]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating financial health: {str(e)}")

# Market Data Endpoints
@app.get("/api/market/stocks/{symbol}")
async def get_stock_data(symbol: str):
    """Get current stock data"""
    try:
        import yfinance as yf
        
        ticker = yf.Ticker(symbol.upper())
        info = ticker.info
        hist = ticker.history(period="1d")
        
        if hist.empty:
            raise HTTPException(status_code=404, detail="Stock symbol not found")
        
        current_price = hist['Close'].iloc[-1]
        previous_close = info.get('previousClose', current_price)
        change = current_price - previous_close
        change_percent = (change / previous_close) * 100 if previous_close != 0 else 0
        
        # Convert to INR if currency is USD
        currency = info.get('currency', 'USD')
        exchange_rate = 1.0
        
        # Get USD to INR exchange rate if needed
        if currency == 'USD':
            try:
                import requests
                forex_url = "https://api.exchangerate-api.com/v4/latest/USD"
                forex_response = requests.get(forex_url)
                if forex_response.status_code == 200:
                    forex_data = forex_response.json()
                    exchange_rate = forex_data.get('rates', {}).get('INR', 83.0)  # Fallback to approximate rate
                else:
                    exchange_rate = 83.0  # Default USD to INR rate
            except:
                exchange_rate = 83.0  # Default USD to INR rate
            
            current_price *= exchange_rate
            change *= exchange_rate
            currency = 'INR'
        
        return {
            "symbol": symbol.upper(),
            "name": info.get('longName', 'N/A'),
            "price": round(current_price, 2),
            "change": round(change, 2),
            "changePercent": round(change_percent, 2),
            "volume": info.get('volume', 0),
            "marketCap": info.get('marketCap'),
            "pe": info.get('trailingPE'),
            "dividend": info.get('dividendRate'),
            "currency": currency,
            "exchange": info.get('exchange', 'Unknown'),
            "exchangeRate": exchange_rate if currency == 'INR' else 1.0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stock data: {str(e)}")

@app.get("/api/market/stocks/{symbol}/history")
async def get_stock_history(symbol: str, period: str = "1mo"):
    """Get historical stock data"""
    try:
        import yfinance as yf
        
        valid_periods = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"]
        if period not in valid_periods:
            period = "1mo"
        
        ticker = yf.Ticker(symbol.upper())
        hist = ticker.history(period=period)
        
        if hist.empty:
            raise HTTPException(status_code=404, detail="Stock symbol not found")
        
        # Get USD to INR exchange rate
        exchange_rate = 1.0
        try:
            import requests
            forex_url = "https://api.exchangerate-api.com/v4/latest/USD"
            forex_response = requests.get(forex_url)
            if forex_response.status_code == 200:
                forex_data = forex_response.json()
                exchange_rate = forex_data.get('rates', {}).get('INR', 83.0)
            else:
                exchange_rate = 83.0
        except:
            exchange_rate = 83.0
        
        history_data = []
        for date, row in hist.iterrows():
            history_data.append({
                "date": date.strftime("%Y-%m-%d"),
                "open": round(row['Open'] * exchange_rate, 2),
                "high": round(row['High'] * exchange_rate, 2),
                "low": round(row['Low'] * exchange_rate, 2),
                "close": round(row['Close'] * exchange_rate, 2),
                "volume": int(row['Volume'])
            })
        
        return {
            "symbol": symbol.upper(),
            "period": period,
            "data": history_data,
            "currency": "INR",
            "exchangeRate": exchange_rate
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stock history: {str(e)}")

@app.get("/api/market/indices")
async def get_market_indices():
    """Get major market indices including Indian indices"""
    try:
        import yfinance as yf
        import requests
        
        # Get USD to INR exchange rate
        exchange_rate = 83.0
        try:
            forex_url = "https://api.exchangerate-api.com/v4/latest/USD"
            forex_response = requests.get(forex_url)
            if forex_response.status_code == 200:
                forex_data = forex_response.json()
                exchange_rate = forex_data.get('rates', {}).get('INR', 83.0)
        except:
            pass
        
        indices = {
            # Indian Indices (already in INR)
            "^NSEI": {"name": "NIFTY 50", "currency": "INR"},
            "^BSESN": {"name": "BSE SENSEX", "currency": "INR"},
            "^NSEBANK": {"name": "NIFTY Bank", "currency": "INR"},
            # Global indices (convert to INR)
            "^GSPC": {"name": "S&P 500", "currency": "USD"},
            "^DJI": {"name": "Dow Jones", "currency": "USD"},
            "^IXIC": {"name": "NASDAQ", "currency": "USD"},
            "^VIX": {"name": "VIX", "currency": "USD"}
        }
        
        results = []
        for symbol, info in indices.items():
            try:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period="2d")
                
                if not hist.empty:
                    current = hist['Close'].iloc[-1]
                    previous = hist['Close'].iloc[-2] if len(hist) > 1 else current
                    change = current - previous
                    change_percent = (change / previous) * 100 if previous != 0 else 0
                    
                    # Convert to INR if needed
                    if info["currency"] == "USD":
                        current *= exchange_rate
                        change *= exchange_rate
                    
                    results.append({
                        "symbol": symbol,
                        "name": info["name"],
                        "value": round(current, 2),
                        "change": round(change, 2),
                        "changePercent": round(change_percent, 2),
                        "currency": "INR"
                    })
            except:
                continue
        
        return {"indices": results, "exchangeRate": exchange_rate}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching market indices: {str(e)}")

@app.get("/api/market/crypto")
async def get_crypto_data():
    """Get cryptocurrency data in INR"""
    try:
        import requests
        
        # Using CoinGecko API to get prices in INR
        url = "https://api.coingecko.com/api/v3/coins/markets"
        params = {
            "vs_currency": "inr",  # Changed to INR
            "order": "market_cap_desc",
            "per_page": 10,
            "page": 1,
            "sparkline": False
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        crypto_list = []
        for coin in data:
            crypto_list.append({
                "symbol": coin['symbol'].upper(),
                "name": coin['name'],
                "price": round(coin['current_price'], 2),
                "change": round(coin['price_change_24h'], 2),
                "changePercent": round(coin['price_change_percentage_24h'], 2),
                "marketCap": coin['market_cap'],
                "volume": coin['total_volume'],
                "currency": "INR"
            })
        
        return {"cryptocurrencies": crypto_list}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching crypto data: {str(e)}")

@app.get("/api/market/forex")
async def get_forex_rates():
    """Get foreign exchange rates with INR as focus"""
    try:
        import requests
        
        # Get rates from both USD base and INR base
        results = {}
        
        # USD to other currencies including INR
        url = "https://api.exchangerate-api.com/v4/latest/USD"
        response = requests.get(url)
        response.raise_for_status()
        usd_data = response.json()
        
        # INR to other major currencies
        inr_url = "https://api.exchangerate-api.com/v4/latest/INR"
        inr_response = requests.get(inr_url)
        
        major_currencies = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "SGD"]
        
        # From USD perspective
        usd_rates = {}
        for currency in major_currencies:
            if currency in usd_data['rates']:
                usd_rates[f"USD/{currency}"] = usd_data['rates'][currency]
        
        # From INR perspective (if available)
        inr_rates = {}
        if inr_response.status_code == 200:
            inr_data = inr_response.json()
            for currency in major_currencies:
                if currency in inr_data['rates']:
                    inr_rates[f"INR/{currency}"] = inr_data['rates'][currency]
        
        return {
            "primaryCurrency": "INR",
            "usdToInr": usd_data['rates'].get('INR', 83.0),
            "date": usd_data['date'],
            "usdRates": usd_rates,
            "inrRates": inr_rates
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching forex data: {str(e)}")

# Investment Endpoints
@app.post("/api/investments")
async def create_investment(
    investment: InvestmentCreate,
    user: dict = Depends(verify_firebase_token)
):
    """Create new investment in Firestore"""
    try:
        investments_ref = db.collection('investments')
        
        investment_data = {
            "userId": user['uid'],
            "symbol": investment.symbol.upper(),
            "name": investment.name,
            "type": investment.type,
            "quantity": investment.quantity,
            "purchasePrice": investment.purchasePrice,
            "purchaseDate": datetime.fromisoformat(investment.purchaseDate.replace('Z', '+00:00')),
            "exchange": investment.exchange,
            "notes": investment.notes,
            "currency": "INR",  # All new investments stored in INR
            "isActive": True,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP
        }
        
        doc_ref = investments_ref.add(investment_data)
        return {"message": "Investment created successfully", "investment_id": doc_ref[1].id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating investment: {str(e)}")

@app.get("/api/investments")
async def get_investments(user: dict = Depends(verify_firebase_token)):
    """Get user investments with current market data in INR"""
    try:
        import requests
        
        # Get USD to INR exchange rate
        exchange_rate = 83.0
        try:
            forex_url = "https://api.exchangerate-api.com/v4/latest/USD"
            forex_response = requests.get(forex_url)
            if forex_response.status_code == 200:
                forex_data = forex_response.json()
                exchange_rate = forex_data.get('rates', {}).get('INR', 83.0)
        except:
            pass
        
        investments_ref = db.collection('investments')
        query = investments_ref.where('userId', '==', user['uid']).where('isActive', '==', True)
        
        docs = query.stream()
        investments = []
        
        for doc in docs:
            investment_data = doc.to_dict()
            investment_data['id'] = doc.id
            
            # Try to get current market data for the investment
            try:
                if investment_data['type'] in ['stocks', 'etf']:
                    import yfinance as yf
                    ticker = yf.Ticker(investment_data['symbol'])
                    hist = ticker.history(period="1d")
                    if not hist.empty:
                        current_price = hist['Close'].iloc[-1]
                        
                        # Convert to INR
                        current_price_inr = current_price * exchange_rate
                        purchase_price_inr = investment_data['purchasePrice']
                        
                        # Assume purchase price is already in INR, but if it was stored in USD, convert it
                        # For new investments, we'll store in INR, for old ones this handles conversion
                        if investment_data.get('currency', 'INR') == 'USD':
                            purchase_price_inr = investment_data['purchasePrice'] * exchange_rate
                        
                        investment_data['currentPrice'] = round(current_price_inr, 2)
                        investment_data['currentValue'] = round(current_price_inr * investment_data['quantity'], 2)
                        investment_data['totalReturn'] = round(
                            (current_price_inr - purchase_price_inr) * investment_data['quantity'], 2
                        )
                        investment_data['returnPercentage'] = round(
                            ((current_price_inr - purchase_price_inr) / purchase_price_inr) * 100, 2
                        )
                    else:
                        # Fallback values if no market data
                        investment_data['currentPrice'] = investment_data['purchasePrice']
                        investment_data['currentValue'] = round(investment_data['purchasePrice'] * investment_data['quantity'], 2)
                        investment_data['totalReturn'] = 0
                        investment_data['returnPercentage'] = 0
                else:
                    # For non-stock investments, use purchase price as current
                    investment_data['currentPrice'] = investment_data['purchasePrice']
                    investment_data['currentValue'] = round(investment_data['purchasePrice'] * investment_data['quantity'], 2)
                    investment_data['totalReturn'] = 0
                    investment_data['returnPercentage'] = 0
            except:
                # Fallback if market data fetch fails
                investment_data['currentPrice'] = investment_data['purchasePrice']
                investment_data['currentValue'] = round(investment_data['purchasePrice'] * investment_data['quantity'], 2)
                investment_data['totalReturn'] = 0
                investment_data['returnPercentage'] = 0
            
            investments.append(investment_data)
        
        return {"investments": investments}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching investments: {str(e)}")

@app.put("/api/investments/{investment_id}")
async def update_investment(
    investment_id: str,
    investment_update: InvestmentUpdate,
    user: dict = Depends(verify_firebase_token)
):
    """Update an existing investment"""
    try:
        investment_ref = db.collection('investments').document(investment_id)
        investment_doc = investment_ref.get()
        
        if not investment_doc.exists:
            raise HTTPException(status_code=404, detail="Investment not found")
        
        investment_data = investment_doc.to_dict()
        if investment_data['userId'] != user['uid']:
            raise HTTPException(status_code=403, detail="Not authorized to update this investment")
        
        update_data = investment_update.model_dump(exclude_unset=True)
        if 'purchaseDate' in update_data:
            update_data['purchaseDate'] = datetime.fromisoformat(update_data['purchaseDate'].replace('Z', '+00:00'))
        update_data['updatedAt'] = firestore.SERVER_TIMESTAMP
        
        investment_ref.update(update_data)
        return {"message": "Investment updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating investment: {str(e)}")

@app.delete("/api/investments/{investment_id}")
async def delete_investment(
    investment_id: str,
    user: dict = Depends(verify_firebase_token)
):
    """Delete an investment (soft delete)"""
    try:
        investment_ref = db.collection('investments').document(investment_id)
        investment_doc = investment_ref.get()
        
        if not investment_doc.exists:
            raise HTTPException(status_code=404, detail="Investment not found")
        
        investment_data = investment_doc.to_dict()
        if investment_data['userId'] != user['uid']:
            raise HTTPException(status_code=403, detail="Not authorized to delete this investment")
        
        investment_ref.update({
            'isActive': False,
            'updatedAt': firestore.SERVER_TIMESTAMP
        })
        return {"message": "Investment deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting investment: {str(e)}")

@app.get("/api/investments/portfolio-summary")
async def get_portfolio_summary(user: dict = Depends(verify_firebase_token)):
    """Get portfolio summary with total values and performance"""
    try:
        import requests
        
        # Get USD to INR exchange rate
        exchange_rate = 83.0
        try:
            forex_url = "https://api.exchangerate-api.com/v4/latest/USD"
            forex_response = requests.get(forex_url)
            if forex_response.status_code == 200:
                forex_data = forex_response.json()
                exchange_rate = forex_data.get('rates', {}).get('INR', 83.0)
        except:
            pass
        
        investments_ref = db.collection('investments')
        query = investments_ref.where('userId', '==', user['uid']).where('isActive', '==', True)
        
        docs = query.stream()
        
        total_invested = 0
        total_current_value = 0
        total_return = 0
        investments_by_type = {}
        
        for doc in docs:
            investment = doc.to_dict()
            
            # Handle purchase price conversion
            purchase_price_inr = investment['purchasePrice']
            if investment.get('currency', 'INR') == 'USD':
                purchase_price_inr = investment['purchasePrice'] * exchange_rate
            
            invested_amount = investment['quantity'] * purchase_price_inr
            total_invested += invested_amount
            
            # Try to get current market value
            try:
                if investment['type'] in ['stocks', 'etf']:
                    import yfinance as yf
                    ticker = yf.Ticker(investment['symbol'])
                    hist = ticker.history(period="1d")
                    if not hist.empty:
                        current_price_usd = hist['Close'].iloc[-1]
                        current_price_inr = current_price_usd * exchange_rate
                        current_value = current_price_inr * investment['quantity']
                    else:
                        current_value = invested_amount
                else:
                    current_value = invested_amount
            except:
                current_value = invested_amount
            
            total_current_value += current_value
            total_return += (current_value - invested_amount)
            
            # Group by type
            inv_type = investment['type']
            if inv_type not in investments_by_type:
                investments_by_type[inv_type] = {
                    "count": 0,
                    "invested": 0,
                    "currentValue": 0
                }
            
            investments_by_type[inv_type]["count"] += 1
            investments_by_type[inv_type]["invested"] += invested_amount
            investments_by_type[inv_type]["currentValue"] += current_value
        
        return_percentage = (total_return / total_invested * 100) if total_invested > 0 else 0
        
        return {
            "totalInvested": round(total_invested, 2),
            "totalCurrentValue": round(total_current_value, 2),
            "totalReturn": round(total_return, 2),
            "returnPercentage": round(return_percentage, 2),
            "byType": {
                inv_type: {
                    "count": data["count"],
                    "invested": round(data["invested"], 2),
                    "currentValue": round(data["currentValue"], 2),
                    "return": round(data["currentValue"] - data["invested"], 2),
                    "returnPercent": round(
                        ((data["currentValue"] - data["invested"]) / data["invested"] * 100) if data["invested"] > 0 else 0, 2
                    )
                }
                for inv_type, data in investments_by_type.items()
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating portfolio summary: {str(e)}")

# Budget Endpoints
@app.post("/api/budgets")
async def create_budget(
    budget: BudgetCreate,
    user: dict = Depends(verify_firebase_token)
):
    """Create new budget"""
    try:
        budgets_ref = db.collection('budgets')
        
        budget_data = {
            "userId": user['uid'],
            "category": budget.category,
            "amount": budget.amount,
            "period": budget.period,
            "startDate": datetime.fromisoformat(budget.startDate.replace('Z', '+00:00')),
            "endDate": datetime.fromisoformat(budget.endDate.replace('Z', '+00:00')),
            "alertThreshold": budget.alertThreshold,
            "currency": "INR",  # All budgets stored in INR
            "isActive": True,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP
        }
        
        doc_ref = budgets_ref.add(budget_data)
        return {"message": "Budget created successfully", "budget_id": doc_ref[1].id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating budget: {str(e)}")

@app.get("/api/budgets")
async def get_budgets(user: dict = Depends(verify_firebase_token)):
    """Get user budgets with spending analysis"""
    try:
        budgets_ref = db.collection('budgets')
        query = budgets_ref.where('userId', '==', user['uid']).where('isActive', '==', True)
        
        docs = query.stream()
        budgets = []
        
        for doc in docs:
            budget_data = doc.to_dict()
            budget_data['id'] = doc.id
            
            # Calculate spent amount for this budget period
            expenses_ref = db.collection('expenses')
            expense_query = expenses_ref.where('userId', '==', user['uid'])\
                .where('category', '==', budget_data['category'])\
                .where('date', '>=', budget_data['startDate'])\
                .where('date', '<=', budget_data['endDate'])
            
            spent_amount = 0
            for expense_doc in expense_query.stream():
                spent_amount += expense_doc.to_dict()['amount']
            
            budget_data['spentAmount'] = round(spent_amount, 2)
            budget_data['remainingAmount'] = round(budget_data['amount'] - spent_amount, 2)
            budget_data['percentageUsed'] = round((spent_amount / budget_data['amount'] * 100), 2) if budget_data['amount'] > 0 else 0
            
            # Check if alert threshold is exceeded
            budget_data['isOverThreshold'] = budget_data['percentageUsed'] > budget_data['alertThreshold']
            budget_data['isOverBudget'] = spent_amount > budget_data['amount']
            
            budgets.append(budget_data)
        
        return {"budgets": budgets}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching budgets: {str(e)}")

@app.put("/api/budgets/{budget_id}")
async def update_budget(
    budget_id: str,
    budget_update: BudgetUpdate,
    user: dict = Depends(verify_firebase_token)
):
    """Update an existing budget"""
    try:
        budget_ref = db.collection('budgets').document(budget_id)
        budget_doc = budget_ref.get()
        
        if not budget_doc.exists:
            raise HTTPException(status_code=404, detail="Budget not found")
        
        budget_data = budget_doc.to_dict()
        if budget_data['userId'] != user['uid']:
            raise HTTPException(status_code=403, detail="Not authorized to update this budget")
        
        update_data = budget_update.model_dump(exclude_unset=True)
        if 'startDate' in update_data:
            update_data['startDate'] = datetime.fromisoformat(update_data['startDate'].replace('Z', '+00:00'))
        if 'endDate' in update_data:
            update_data['endDate'] = datetime.fromisoformat(update_data['endDate'].replace('Z', '+00:00'))
        update_data['updatedAt'] = firestore.SERVER_TIMESTAMP
        
        budget_ref.update(update_data)
        return {"message": "Budget updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating budget: {str(e)}")

@app.delete("/api/budgets/{budget_id}")
async def delete_budget(
    budget_id: str,
    user: dict = Depends(verify_firebase_token)
):
    """Delete a budget (soft delete)"""
    try:
        budget_ref = db.collection('budgets').document(budget_id)
        budget_doc = budget_ref.get()
        
        if not budget_doc.exists:
            raise HTTPException(status_code=404, detail="Budget not found")
        
        budget_data = budget_doc.to_dict()
        if budget_data['userId'] != user['uid']:
            raise HTTPException(status_code=403, detail="Not authorized to delete this budget")
        
        budget_ref.update({
            'isActive': False,
            'updatedAt': firestore.SERVER_TIMESTAMP
        })
        return {"message": "Budget deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting budget: {str(e)}")


# ─────────────────────────────────────────────
#  AI INSIGHTS PIPELINE  (Groq — OpenAI-compatible)
# ─────────────────────────────────────────────

@app.post("/api/ai/generate-insights")
async def generate_ai_insights(user: dict = Depends(verify_firebase_token)):
    """
    Generate personalised financial insights using Groq's OpenAI-compatible API.

    Pipeline:
      1. Fetch user's expenses, budgets & investments from Firestore.
      2. Build system + user messages for the 'Neo' AI persona.
      3. Call Groq (llama-3.3-70b-versatile) via the OpenAI-compatible client.
      4. Parse the JSON response and persist each insight to Firestore.
      5. Return the generated insights list.
    """
    try:
        from groq import Groq

        # ── 1. Initialise Groq client ─────────────────────────────────────────
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key or groq_api_key == "your-groq-api-key-here":
            raise HTTPException(
                status_code=503,
                detail="GROQ_API_KEY is not configured. Please add your Groq API key to server/app/.env."
            )

        client = Groq(api_key=groq_api_key)
        uid = user["uid"]

        # ── 2. Fetch financial data ───────────────────────────────────────────
        # Expenses (last 50)
        expense_docs = (
            db.collection("expenses")
            .where("userId", "==", uid)
            .order_by("date", direction=firestore.Query.DESCENDING)
            .limit(50)
            .stream()
        )
        expenses = []
        for doc in expense_docs:
            d = doc.to_dict()
            expenses.append({
                "category": d.get("category", "Unknown"),
                "amount": d.get("amount", 0),
                "description": d.get("description", ""),
                "date": d.get("date").strftime("%Y-%m-%d") if d.get("date") else "",
            })

        # Budgets (active)
        budget_docs = (
            db.collection("budgets")
            .where("userId", "==", uid)
            .where("isActive", "==", True)
            .stream()
        )
        budgets = []
        for doc in budget_docs:
            d = doc.to_dict()
            budgets.append({
                "category": d.get("category", "Unknown"),
                "budgetAmount": d.get("amount", 0),
                "period": d.get("period", "monthly"),
            })

        # Investments (active)
        investment_docs = (
            db.collection("investments")
            .where("userId", "==", uid)
            .where("isActive", "==", True)
            .stream()
        )
        investments = []
        for doc in investment_docs:
            d = doc.to_dict()
            investments.append({
                "symbol": d.get("symbol", ""),
                "name": d.get("name", ""),
                "type": d.get("type", ""),
                "quantity": d.get("quantity", 0),
                "purchasePrice": d.get("purchasePrice", 0),
            })

        # User profile (income & risk tolerance)
        user_doc = db.collection("users").document(uid).get()
        profile = {}
        if user_doc.exists:
            p = user_doc.to_dict()
            profile = {
                "monthlyIncome": p.get("monthlyIncome", 0),
                "riskTolerance": p.get("riskTolerance", "medium"),
                "age": p.get("age"),
            }

        # ── 3. Compute quick summary stats ────────────────────────────────────
        total_spent = sum(e["amount"] for e in expenses)
        category_totals: Dict[str, float] = {}
        for e in expenses:
            category_totals[e["category"]] = category_totals.get(e["category"], 0) + e["amount"]
        top_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:5]

        monthly_income = profile.get("monthlyIncome", 0)
        savings_rate = round(((monthly_income - total_spent) / monthly_income * 100), 1) if monthly_income > 0 else None

        # ── 4. Build messages ─────────────────────────────────────────────────
        system_message = (
            "You are Neo, an expert personal finance advisor for Indian users. "
            "All monetary values are in Indian Rupees (INR, ₹). "
            "Your goal is to provide exactly 5 specific, actionable financial insights based on the user's real data. "
            "Rules:\n"
            "- Be concise, supportive, and warm in tone.\n"
            "- Use relevant emojis in titles (e.g. 💰, 📈, 🎯, 🏦, ⚠️, 💡, 🔥).\n"
            "- Prioritise insights by impact (high/medium/low).\n"
            "- Each insight must have a concrete suggested action with a specific ₹ amount or percentage where relevant.\n"
            "- Output ONLY valid JSON — no markdown, no explanation outside the JSON.\n"
            "- The JSON must be an array of exactly 5 objects, each with keys:\n"
            '  "title", "description", "priority" (high|medium|low), "category", "suggestedAction"\n'
        )

        categories_str = "\n".join(f"  - {cat}: ₹{amt:,.0f}" for cat, amt in top_categories)
        user_message = "\n".join([
            "Here is the user's financial snapshot:",
            "",
            f"Monthly Income: ₹{monthly_income:,.0f}",
            f"Total Expenses (recent): ₹{total_spent:,.0f}",
            f"Savings Rate: {savings_rate}%",
            "",
            "Top Spending Categories:",
            categories_str,
            "",
            f"Active Budgets: {json.dumps(budgets, indent=2)}",
            "",
            f"Investments ({len(investments)} total): {json.dumps(investments[:10], indent=2)}",
            "",
            f"User Profile: {json.dumps(profile, indent=2)}",
            "",
            "Generate 5 personalised insights as a JSON array.",
        ])

        # ── 5. Call Groq (OpenAI-compatible) ──────────────────────────────────
        chat_response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user",   "content": user_message},
            ],
            temperature=0.7,
            max_tokens=2048,
        )

        raw_text = chat_response.choices[0].message.content.strip()

        # Strip markdown code fences if the model wraps the JSON
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
            raw_text = raw_text.strip()

        insights: List[Dict[str, Any]] = json.loads(raw_text)

        # Ensure a list
        if not isinstance(insights, list):
            insights = [insights]

        # ── 6. Persist to Firestore ───────────────────────────────────────────
        recommendations_ref = db.collection("ai_recommendations")
        saved: List[Dict[str, Any]] = []

        for insight in insights:
            # Save to Firestore (SERVER_TIMESTAMP is valid here)
            firestore_data = {
                "userId": uid,
                "type": "ai_generated",
                "title": insight.get("title", "Insight"),
                "description": insight.get("description", ""),
                "priority": insight.get("priority", "medium"),
                "category": insight.get("category", "general"),
                "actionable": True,
                "suggestedAction": insight.get("suggestedAction", ""),
                "isRead": False,
                "createdAt": firestore.SERVER_TIMESTAMP,
                "updatedAt": firestore.SERVER_TIMESTAMP,
            }
            doc_ref = recommendations_ref.add(firestore_data)

            # Return real timestamps to the frontend
            response_data = {
                "id": doc_ref[1].id,
                "userId": uid,
                "type": "ai_generated",
                "title": insight.get("title", "Insight"),
                "description": insight.get("description", ""),
                "priority": insight.get("priority", "medium"),
                "category": insight.get("category", "general"),
                "actionable": True,
                "suggestedAction": insight.get("suggestedAction", ""),
                "isRead": False,
                "createdAt": datetime.utcnow().isoformat(),
                "updatedAt": datetime.utcnow().isoformat(),
            }
            saved.append(response_data)

        return {
            "message": f"Generated {len(saved)} AI insights successfully",
            "insights": saved,
        }

    except HTTPException:
        raise
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse Groq response as JSON: {str(e)}"
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error generating AI insights: {str(e)}"
        )