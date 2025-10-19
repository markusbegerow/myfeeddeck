@echo off
:: Check for admin rights
net session >nul 2>&1
if %errorLevel% == 0 (
    goto :runBuild
) else (
    echo Requesting Administrator privileges...
    echo.
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:runBuild
cd /d "%~dp0"
echo ============================================
echo   MyFeedDeck Installer Builder (ADMIN)
echo ============================================
echo.
echo Running with Administrator privileges
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

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Error: Dependencies not installed!
    echo Please run setup.bat first to install dependencies.
    echo.
    pause
    exit /b 1
)

echo Building MyFeedDeck installer...
echo This may take a few minutes...
echo.

REM Build the application
call npm run build
set BUILD_RESULT=%errorlevel%

echo.
if %BUILD_RESULT% NEQ 0 (
    echo ============================================
    echo   BUILD FAILED!
    echo ============================================
    echo.
    echo Error code: %BUILD_RESULT%
    echo Please check the error messages above.
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   BUILD COMPLETED SUCCESSFULLY!
echo ============================================
echo.
echo Your installer has been created in the 'dist' folder:
echo.
dir /b dist\*.exe 2>nul
if errorlevel 1 (
    echo No .exe installer found. Check dist folder for other formats.
) else (
    echo.
    echo Location: %CD%\dist\
)
echo.
echo ============================================
echo.
pause
exit /b 0
