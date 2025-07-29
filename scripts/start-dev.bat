@echo off
echo Starting development servers...

REM Start backend
start "Backend Server" cmd /k "cd backend && call conda activate dwell-insight-backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Start frontend
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo Development servers started!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173