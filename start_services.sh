#!/bin/bash

# Start Redis if not running
if ! redis-cli ping > /dev/null 2>&1; then
    echo "Starting Redis..."
    redis-server --daemonize yes
fi

# Start AI Service
echo "Starting AI Service..."
cd resyft-ai-service
source venv/bin/activate
python main.py &
AI_PID=$!
cd ..

# Wait for AI service to start
sleep 3

# Start Backend
echo "Starting Backend..."
cd resyft-backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start Frontend
echo "Starting Frontend..."
cd resyft-frontend
npm run dev &
FRONTEND_PID=$!

echo "All services started!"
echo "AI Service PID: $AI_PID"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Access the app at http://localhost:3000"
echo ""
echo "To stop all services, run: kill $AI_PID $BACKEND_PID $FRONTEND_PID"

# Keep script running
wait