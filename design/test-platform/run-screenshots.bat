@echo off
setlocal enabledelayedexpansion

title Xiaohongshu Quiz Screenshot Tool

cd /d "%~dp0"
if exist "test-platform\scripts\capture-results.ts" (
    cd "test-platform"
) else if not exist "scripts\capture-results.ts" (
    echo [ERROR] Cannot find scripts\capture-results.ts
    echo Current Directory: %CD%
    echo.
    pause
    exit /b 1
)

:: If arguments provided, run once
if not "%~1"=="" (
    call npx tsx scripts/capture-results.ts %*
    if !ERRORLEVEL! NEQ 0 (
        echo.
        echo [ERROR] Process finished with exit code !ERRORLEVEL!
    )
    echo.
    pause
    exit /b !ERRORLEVEL!
)

:MENU_LOOP
cls
echo ====================================================================
echo    Xiaohongshu Quiz Result Screenshot Tool
echo ====================================================================
echo.

call npx tsx scripts/capture-results.ts

echo.
echo ====================================================================
echo  [Next Step]
echo    [1] Continue to next quiz screenshot (Press ENTER)
echo    [2] Open exported screenshots folder
echo    [0] Exit tool
echo ====================================================================
set "CHOICE=1"
set /p "CHOICE=Please select [1/2/0, Default 1]: "

if "%CHOICE%"=="1" goto MENU_LOOP
if "%CHOICE%"=="" goto MENU_LOOP
if "%CHOICE%"=="2" (
    if exist "..\product-docs" (
        start "" explorer.exe "..\product-docs"
    ) else if exist "product-docs" (
        start "" explorer.exe "product-docs"
    )
    goto MENU_LOOP
)
if "%CHOICE%"=="0" goto EXIT_TOOL
if /i "%CHOICE%"=="q" goto EXIT_TOOL

goto MENU_LOOP

:EXIT_TOOL
echo.
echo Tool exited safely.
pause
exit /b 0
