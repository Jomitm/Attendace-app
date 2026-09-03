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

for /f "delims=" %%I in ('git branch --show-current') do set "CURRENT_BRANCH=%%I"
if /i not "%CURRENT_BRANCH%"=="main" goto :wrong_branch

echo [1/5] Running validation...
call npm run lint
if errorlevel 1 goto :fail
call npm run test:unit
if errorlevel 1 goto :fail
call npm run build
if errorlevel 1 goto :fail

echo [2/5] Staging changes...
git add -A
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

echo.
echo Staged changes:
git diff --cached --stat
echo.
set "CONFIRM_PUSH="
set /p CONFIRM_PUSH="Create commit and push these changes? (Y/N): "
if /i not "%CONFIRM_PUSH%"=="Y" goto :cancel

echo [3/5] Creating commit...
set "COMMIT_MSG="
set /p COMMIT_MSG="Enter commit message (or press Enter for default): "
if not defined COMMIT_MSG set "COMMIT_MSG=Update %DATE% %TIME%"
git commit -m "%COMMIT_MSG%"
if errorlevel 1 goto :fail

for /f "delims=" %%I in ('git rev-parse --short HEAD') do set "CURRENT_SHA=%%I"

echo [4/5] Pushing to GitHub...
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
echo Check the output above for the error message.
echo.
pause
exit /b 1

:wrong_branch
echo.
echo Deployment cancelled because the current branch is not main.
echo Current branch: %CURRENT_BRANCH%
echo Switch to main and rerun this script.
echo.
pause
exit /b 1

:cancel
echo.
echo Deployment cancelled. No commit or push was performed.
echo.
pause
exit /b 0

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