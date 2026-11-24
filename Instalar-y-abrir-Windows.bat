@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Falta Node.js. Instala Node.js desde https://nodejs.org/ y vuelve a ejecutar este archivo.
  pause
  exit /b 1
)
call npm install
if errorlevel 1 pause
call npm start
