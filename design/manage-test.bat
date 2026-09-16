@echo off
title Test Platform Manager

:menu
cls
echo ==========================================
echo     test-platform Local Service Manager
echo ==========================================
echo 1. Start Test Service (npm run dev)
echo 2. Stop Test Service (Kill port 3000)
echo 3. Exit
echo ==========================================
set /p choice="Enter your choice (1/2/3): "

if "%choice%"=="1" goto start_server
if "%choice%"=="2" goto stop_server
if "%choice%"=="3" goto exit_tool
goto menu

:start_server
echo Starting test-platform...
cd /d "%~dp0test-platform"
start "Next.js - test-platform" cmd /k "npx next dev -p 3000"
echo Start command sent! Address: http://localhost:3000
timeout /t 3
goto menu

:stop_server
echo Searching for process on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Found process PID: %%a, killing it...
    taskkill /f /pid %%a
)
echo Cleaned up port 3000.
pause
goto menu

:exit_tool
exit
