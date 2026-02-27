@echo off
echo ==============================================
echo      Deploying Attendance App to GitHub
echo ==============================================
echo.

cd /d "%~dp0"

echo [0/3] Configuring Remote...
git remote add origin https://github.com/Jomitm/Attendace-app 2>nul
git remote set-url origin https://github.com/Jomitm/Attendace-app

echo [1/3] Adding changes...
git add .

echo [2/3] Committing changes...
git commit -m "Fix: Real-time sync for Windows client and DB optimizations"

echo [3/3] Pushing to GitHub...
git push origin main

echo.
echo ==============================================
echo               DEPLOY SUCCESS
echo ==============================================
echo.
echo You can now go to Vercel and import this repository:
echo https://github.com/Jomitm/Attendace-app
echo.
pause
