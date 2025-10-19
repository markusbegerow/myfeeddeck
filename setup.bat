@echo off
echo Installing MyFeedDeck Electron dependencies...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Install dependencies
echo Installing npm dependencies...
call npm install
set INSTALL_RESULT=%errorlevel%

if %INSTALL_RESULT% NEQ 0 (
    echo.
    echo Warning: npm install completed with warnings or errors
    echo Error code: %INSTALL_RESULT%
    echo.
    echo This may be normal. Check the output above for details.
    echo.
)

echo.
echo ============================================
echo   SETUP COMPLETED SUCCESSFULLY!
echo ============================================
echo.
echo To start the application in development mode:
echo   npm run dev
echo.
echo To build the application:
echo   npm run build
echo.
echo To start the production application:
echo   npm start
echo.
echo ============================================
echo.
pause
exit /b 0