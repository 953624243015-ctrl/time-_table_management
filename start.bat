@echo off
title AI College Timetable Management System
color 0A

echo.
echo  ============================================
echo   AI College Timetable Management System
echo  ============================================
echo.

REM Set Node.js path
set PATH=C:\Program Files\nodejs;%PATH%

REM Check if Node.js is available
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js not found. Please install Node.js first.
    pause
    exit
)

REM Check if MySQL (XAMPP) is running
echo  [1/3] Checking MySQL (XAMPP)...
sc query mysql | find "RUNNING" >nul 2>&1
if %errorlevel% neq 0 (
    echo  [INFO] Starting MySQL service...
    net start mysql >nul 2>&1
    timeout /t 3 /nobreak >nul
)
echo  [OK]  MySQL is running.

REM Start Backend
echo  [2/3] Starting Backend (port 5000)...
start "Backend - Timetable API" cmd /k "set PATH=C:\Program Files\nodejs;%PATH% && cd /d "c:\Users\24ad010\time table\backend" && node src/server.js"
timeout /t 3 /nobreak >nul
echo  [OK]  Backend started.

REM Start Frontend
echo  [3/3] Starting Frontend (port 5173)...
start "Frontend - Timetable App" cmd /k "set PATH=C:\Program Files\nodejs;%PATH% && cd /d "c:\Users\24ad010\time table\frontend" && node node_modules\vite\bin\vite.js"
timeout /t 4 /nobreak >nul
echo  [OK]  Frontend started.

echo.
echo  ============================================
echo   System is starting up...
echo.
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:5000
echo.
echo   Login    : admin@college.edu
echo   Password : Admin@123
echo  ============================================
echo.

REM Open browser
timeout /t 2 /nobreak >nul
start "" "http://localhost:5173"

echo  Browser opened. Press any key to exit this window.
pause >nul
