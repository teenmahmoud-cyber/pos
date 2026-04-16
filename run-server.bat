@echo off
title Oman POS Server
color 0A
cd /d "%~dp0"
echo ========================================
echo   Oman POS System - Starting Server
echo ========================================
echo.
npm run dev -- -p 3010
