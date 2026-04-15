#!/bin/bash

# NeoVest Setup Script
echo "🚀 Setting up NeoVest - Intelligent Finance Assistant"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Navigate to server directory
cd server

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "⬇️ Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Navigate back to root
cd ..

# Navigate to client directory
cd client

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Navigate back to root
cd ..

# Create environment files if they don't exist
if [ ! -f "server/.env" ]; then
    echo "📝 Creating server environment file..."
    cat > server/.env << EOL
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# API Keys (Optional for enhanced features)
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key
OPENAI_API_KEY=your-openai-key

# Redis Configuration (for background tasks)
REDIS_URL=redis://localhost:6379
EOL
    echo "⚠️ Please update server/.env with your Firebase and API keys"
fi

if [ ! -f "client/.env.local" ]; then
    echo "📝 Creating client environment file..."
    cat > client/.env.local << EOL
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
EOL
    echo "⚠️ Please update client/.env.local with your Firebase configuration"
fi

echo ""
echo "✅ NeoVest setup completed!"
echo ""
echo "🔥 Next steps:"
echo "1. Update environment files with your Firebase and API keys"
echo "2. Start the backend server:"
echo "   cd server && source venv/bin/activate && python app/main.py"
echo "3. In a new terminal, start the frontend:"
echo "   cd client && npm run dev"
echo ""
echo "🌟 Your intelligent finance assistant will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "📚 Features available:"
echo "   ✅ Expense Tracking"
echo "   ✅ Investment Portfolio Management"
echo "   ✅ Budget Planning & Monitoring"
echo "   ✅ Financial Health Analysis"
echo "   ✅ AI-Powered Recommendations"
echo "   ✅ Real-time Market Data"
echo "   ✅ Goal Tracking"
echo "   ✅ Analytics Dashboard"
echo ""
