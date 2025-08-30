# server/app/main.py
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import credentials, auth
import os
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Initialize Firebase Admin SDK
def initialize_firebase():
    if not firebase_admin._apps:
        # Create credentials from environment variables
        cred_dict = {
            "type": "service_account",
            "project_id": os.getenv("FIREBASE_PROJECT_ID"),
            "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
            "private_key": os.getenv("FIREBASE_PRIVATE_KEY").replace('\\n', '\n'),
            "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
            "client_id": os.getenv("FIREBASE_CLIENT_ID"),
            "auth_uri": os.getenv("FIREBASE_AUTH_URI"),
            "token_uri": os.getenv("FIREBASE_TOKEN_URI"),
        }
        
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)

initialize_firebase()

app = FastAPI(
    title="NeoVest API",
    description="An intelligent finance assistant API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

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
    return {"message": "NeoVest API is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/protected")
async def protected_route(user: dict = Depends(verify_firebase_token)):
    return {
        "message": "This is a protected route",
        "user_id": user["uid"],
        "user_email": user.get("email", "No email provided")
    }

# User Profile Endpoints
@app.get("/api/user/profile")
async def get_user_profile(user: dict = Depends(verify_firebase_token)):
    """Get user profile information"""
    return {
        "user_id": user["uid"],
        "email": user.get("email"),
        "name": user.get("name", ""),
        "created_at": user.get("auth_time")
    }

# Expense Tracking Endpoints
@app.get("/api/expenses")
async def get_expenses(user: dict = Depends(verify_firebase_token)):
    """Get user expenses"""
    # TODO: Implement expense fetching from database
    return {
        "expenses": [],
        "total": 0,
        "user_id": user["uid"]
    }

@app.post("/api/expenses")
async def create_expense(expense_data: dict, user: dict = Depends(verify_firebase_token)):
    """Create a new expense"""
    # TODO: Implement expense creation
    return {
        "message": "Expense created successfully",
        "expense_id": "temp_id",
        "user_id": user["uid"]
    }

# Investment Insights Endpoints
@app.get("/api/investments/recommendations")
async def get_investment_recommendations(user: dict = Depends(verify_firebase_token)):
    """Get personalized investment recommendations"""
    # TODO: Implement AI-powered investment recommendations
    return {
        "recommendations": [
            {
                "symbol": "SPY",
                "name": "SPDR S&P 500 ETF",
                "recommendation": "BUY",
                "confidence": 0.85,
                "reason": "Diversified exposure to large-cap US stocks"
            }
        ],
        "user_id": user["uid"]
    }

# Financial Forecasting Endpoints
@app.get("/api/forecast/financial-health")
async def get_financial_forecast(user: dict = Depends(verify_firebase_token)):
    """Get financial health forecast"""
    # TODO: Implement AI-powered financial forecasting
    return {
        "forecast": {
            "next_month_balance": 5000,
            "savings_goal_progress": 0.65,
            "risk_score": 0.3
        },
        "user_id": user["uid"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)