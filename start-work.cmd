@echo off
rem START A WORK SESSION: get the latest changes from GitHub, then run the site locally.
rem Use this on every computer, every time you sit down to work.
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-work.ps1" %*
echo.
pause
