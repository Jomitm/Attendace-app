@echo off
title Command Code

where cmdc >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Command Code (cmdc) is not installed.
    echo Install it: npm install -g command-code
    pause
    exit /b 1
)

cmdc %*
