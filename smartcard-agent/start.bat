@echo off
title Thai SmartCard Agent
cd /d "%~dp0"

set "PATH=C:\node22;%PATH%"
rem บังคับพอร์ต 8182 เพื่อกันชนกับ Next.js ที่ใช้ 3000
set "PORT=8182"

if not exist node_modules (
  echo Installing dependencies for the first time...
  call C:\node22\npm.cmd install
  if errorlevel 1 (
    echo.
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
)

C:\node22\node.exe agent.js
pause
