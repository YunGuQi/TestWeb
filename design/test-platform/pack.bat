@echo off
echo =========================================
echo Starting Next.js build and packaging...
echo =========================================

echo.
echo [1/3] Running npm run build...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed! Check the errors above.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Cleaning up old deploy.zip...
if exist deploy.zip del deploy.zip

echo.
echo [3/3] Zipping required files to deploy.zip...
echo Zipping: .next, public, prisma, package.json, next.config.js
powershell -NoProfile -Command "Compress-Archive -Path '.next', 'public', 'prisma', 'package.json', 'next.config.js' -DestinationPath 'deploy.zip' -Force"

echo.
echo =========================================
echo [SUCCESS] Packaging complete!
echo Please upload deploy.zip to Baota Panel.
echo =========================================
pause
