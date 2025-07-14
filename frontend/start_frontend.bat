@echo off
echo Starting NeoPilot Frontend...
echo.

echo Checking if Node.js is installed...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version

echo.
echo Installing dependencies...
npm install

echo.
echo Starting development server...
echo Frontend will be available at: http://localhost:5173
echo.

npm run dev
