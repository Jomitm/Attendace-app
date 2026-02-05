@echo off
echo ==============================================
echo      Deploying Update to GitHub (Fixes)
echo ==============================================
echo.

cd /d "D:\Attendance App"

echo [1/3] Adding changes...
git add .

echo [2/3] Committing changes...
git commit -m "Fix: Login whitespace sensitivity and performance tuning"

echo [3/3] Pushing to GitHub...
git push origin main

echo.
echo ==============================================
echo               UPDATE SUCCESS
echo ==============================================
echo.
pause
