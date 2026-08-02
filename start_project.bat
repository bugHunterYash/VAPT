@echo off
echo ========================================================
echo Starting VMT (Vulnerability Management Tool) Project
echo ========================================================

echo.
echo [1/2] Starting FastAPI Backend...
start "VMT Backend" cmd /k "cd backend && call .\venv\Scripts\activate && uvicorn main:app --reload"

echo [2/2] Starting Next.js Frontend...
start "VMT Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Project startup initiated! 
echo Two new terminal windows have been opened for the frontend and backend processes.
echo.
echo Frontend URL: http://localhost:3000
echo Backend API:  http://127.0.0.1:8000
echo.
pause
