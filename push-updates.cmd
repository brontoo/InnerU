@echo off
rem Commits your changes and pushes them to GitHub (Vercel redeploys automatically).
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0push-updates.ps1" %*
echo.
pause
