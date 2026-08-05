@echo off
title Stopping AI Timetable System
color 0C

echo.
echo  Stopping AI College Timetable System...
echo.

REM Kill Node.js processes (backend + frontend)
taskkill /f /im node.exe >nul 2>&1
echo  [OK] Backend and Frontend stopped.

echo.
echo  All servers stopped. Safe to close.
pause >nul
