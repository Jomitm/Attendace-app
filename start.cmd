@echo off
cd /d "%~dp0"
cmd /k "npm install --include=dev && npx vite"
