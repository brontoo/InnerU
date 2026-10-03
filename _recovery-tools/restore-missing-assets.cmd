@echo off
rem Downloads the 7 assets whose paths the site builds at run time
rem (5 x *-atlas.glb for the Body Atlas viewers + sprint/endurance.webp).
rem Safe to re-run: existing files are kept unless you add -Force.
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0restore-missing-assets.ps1" %*
echo.
pause
