#!/bin/bash

# NeoVest Development Startup Script
echo "🚀 Starting NeoVest Development Environment"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
if ! command_exists python3; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

# Check if setup has been run
if [ ! -f "server/.env" ] || [ ! -f "client/.env.local" ]; then
    echo "⚠️ Environment files not found. Running setup..."
    ./setup.sh
fi

# Start backend server in background
echo "🔧 Starting backend server..."
cd server
source venv/bin/activate 2>/dev/null || echo "⚠️ Virtual environment not found. Please run setup.sh first."
python app/main.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend development server
echo "🎨 Starting frontend development server..."
cd client
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ NeoVest is starting up!"
echo ""
echo "🌐 Services:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "📊 Dashboard Features Available:"
echo "   • Expense Tracking & Analytics"
echo "   • Investment Portfolio Management"
echo "   • Budget Planning & Monitoring"
echo "   • Financial Health Assessment"
echo "   • AI-Powered Recommendations"
echo "   • Real-time Market Data"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Shutting down NeoVest..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ All services stopped."
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup INT

# Wait for user to stop
while true; do
    sleep 1
done
