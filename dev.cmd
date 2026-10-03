@echo off
rem Starts a local web server and opens the site in your browser.
rem Keep this window open while you work; press Ctrl+C to stop the server.
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" %*
echo.
pause
