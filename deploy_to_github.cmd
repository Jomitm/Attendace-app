@echo off
setlocal EnableExtensions

echo ==============================================
echo      Pushing Attendance App to GitHub
echo ==============================================
echo.

cd /d "%~dp0" || goto :fail

echo [0/4] Configuring remote...
git remote get-url origin >nul 2>nul
if errorlevel 1 (
    git remote add origin https://github.com/Jomitm/Attendace-app
    if errorlevel 1 goto :fail
) else (
    git remote set-url origin https://github.com/Jomitm/Attendace-app
    if errorlevel 1 goto :fail
)

echo [1/4] Staging changes...
git add .
if errorlevel 1 goto :fail

set "GIT_AUTHOR_NAME="
set "GIT_AUTHOR_EMAIL="
for /f "delims=" %%I in ('git config --get user.name 2^>nul') do set "GIT_AUTHOR_NAME=%%I"
for /f "delims=" %%I in ('git config --get user.email 2^>nul') do set "GIT_AUTHOR_EMAIL=%%I"

if defined DEPLOY_GIT_NAME set "GIT_AUTHOR_NAME=%DEPLOY_GIT_NAME%"
if defined DEPLOY_GIT_EMAIL set "GIT_AUTHOR_EMAIL=%DEPLOY_GIT_EMAIL%"

if not defined GIT_AUTHOR_NAME goto :missing_identity
if not defined GIT_AUTHOR_EMAIL goto :missing_identity

git config user.name "%GIT_AUTHOR_NAME%" >nul 2>nul
if errorlevel 1 goto :fail
git config user.email "%GIT_AUTHOR_EMAIL%" >nul 2>nul
if errorlevel 1 goto :fail

set "HAS_CHANGES="
for /f "delims=" %%I in ('git status --short') do set "HAS_CHANGES=1"

if not defined HAS_CHANGES (
    echo.
    echo No local file changes were found.
    echo GitHub and the live site will stay on the current commit.
    goto :end
)

echo [2/4] Creating commit...
git commit -m "Fix: Real-time sync for Windows client and DB optimizations"
if errorlevel 1 goto :fail

for /f "delims=" %%I in ('git rev-parse --short HEAD') do set "CURRENT_SHA=%%I"

echo [3/4] Pushing to GitHub...
git push origin main
if errorlevel 1 goto :fail

echo.
echo GitHub push completed successfully.
echo Commit: %CURRENT_SHA%
echo Branch: main
echo.
echo Important:
echo - This script pushes code to GitHub only.
echo - The live site updates separately through your hosting provider, such as Vercel.
echo - If the live site still looks old, check the Vercel deployment for this commit.
echo - If deployment succeeded but the site still looks unchanged, hard refresh or clear site data.
echo.

:end
pause
exit /b 0

:fail
echo.
echo Deployment failed.
echo Check the Git output above for the error message.
echo.
pause
exit /b 1

:missing_identity
echo.
echo Deployment failed.
echo Git does not have a commit author name and email configured.
echo.
echo Run these once, then rerun this script:
echo   git config --global user.name "Your Name"
echo   git config --global user.email "you@example.com"
echo.
echo Or set these environment variables before running the script:
echo   DEPLOY_GIT_NAME
echo   DEPLOY_GIT_EMAIL
echo.
pause
exit /b 1
