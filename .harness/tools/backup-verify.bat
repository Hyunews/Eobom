@echo off
REM backup-verify.bat - double-click wrapper. Korean output lives in backup-verify.ps1 (db-safety.md 8-7).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0backup-verify.ps1"
set RC=%ERRORLEVEL%
echo.
pause
exit /b %RC%
