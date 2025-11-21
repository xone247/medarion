@echo off
REM Enhanced Data Processing - Windows Batch File
REM =============================================

echo.
echo ========================================
echo   Enhanced Data Processing Pipeline
echo ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python first.
    pause
    exit /b 1
)

REM Check if the data directory exists
if not exist "D:\medarion_scraper_output" (
    echo ❌ Data directory not found: D:\medarion_scraper_output
    echo Please update the path in this batch file or create the directory.
    pause
    exit /b 1
)

echo 🚀 Starting data processing...
echo.

REM Run the quick processing script
python quick_process.py

echo.
echo ========================================
echo   Processing Complete!
echo ========================================
echo.
pause
