@echo off
title UPAW Dev Servers
cd /d "%~dp0"
echo.
echo  UPAW - Backend + Frontend
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:5000
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-always.ps1"
pause
