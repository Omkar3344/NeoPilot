@echo off
echo Starting NeoPilot Backend...
echo.

REM Check if virtual environment exists
if not exist "myenv" (
    echo Creating Python virtual environment with Python 3.11...
    py -3.11 -m venv myenv
)

echo Activating virtual environment...
call myenv\Scripts\activate

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Starting FastAPI server...
echo Backend will be available at: http://127.0.0.1:8000
echo WebSocket endpoint: ws://127.0.0.1:8000/ws
echo.

python main.py
