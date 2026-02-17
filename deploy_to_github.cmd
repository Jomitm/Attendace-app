@echo off
echo ==============================================
echo      Deploying Attendance App to GitHub
echo ==============================================
echo.

cd /d "%~dp0"

echo [1/3] Adding changes...
git add .

echo [2/3] Committing changes...
git commit -m "Complete Firebase Integration: Firestore Backend, Parallel Loading, Offline Persistence"

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
