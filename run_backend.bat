@echo off
echo Starting SafeChat360 Backend...
cd /d "%~dp0"
IF EXIST ".venv\Scripts\python.exe" (
    ".venv\Scripts\python.exe" -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
) ELSE (
    echo Virtual environment not found. Please create it first.
    pause
    exit /b 1
)
pause
