@echo off
title Oman POS Server
color 0A
cd /d "%~dp0"
echo ========================================
echo   Oman POS System - Building...
echo ========================================
echo.
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo Build failed! Press any key to exit...
    pause >nul
    exit /b 1
)
echo.
echo ========================================
echo   Starting Server on Port 3011
echo ========================================
echo.
call npm run start -- -p 3011
