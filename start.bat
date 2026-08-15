@echo off
chcp 65001 >nul
title POS System - Start
color 0A

echo.
echo  ╔═══════════════════════════════════════════════════════════╗
echo  ║         🏪 POS System - Quick Start                       ║
echo  ╚═══════════════════════════════════════════════════════════╝
echo.

REM ตรวจสอบ Docker
docker info >nul 2>&1
if errorlevel 1 (
    color 0C
    echo  ❌ Docker ไม่ได้รันอยู่! กรุณาเปิด Docker Desktop ก่อน
    pause
    exit /b 1
)

echo  🚀 กำลังเริ่มต้น POS System...
docker-compose up -d

if errorlevel 1 (
    color 0C
    echo  ❌ ไม่สามารถเริ่ม POS System ได้
    pause
    exit /b 1
)

echo.
echo  ✅ POS System เริ่มทำงานแล้ว!
echo.
echo  📍 IP Address ของเครื่องนี้:
echo  ─────────────────────────────────────────────────────────────
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        echo     🌐 %%b
    )
)
echo  ─────────────────────────────────────────────────────────────
echo.
echo  📱 เข้าใช้งาน: http://smilepharmacy:4000
echo.

REM รอให้ระบบพร้อม แล้วเปิดเบราว์เซอร์ก่อน
echo  ⏳ รอระบบพร้อม...
timeout /t 5 /nobreak >nul

echo  🌐 กำลังเปิดเบราว์เซอร์ไปที่ http://localhost:4000 ...
start "" "http://localhost:4000"

REM แล้วค่อยเปิด Smart Card Agent อัตโนมัติ (ถ้ามี)
if exist "%~dp0smartcard-agent\start.bat" (
    echo  💳 กำลังเปิด Smart Card Agent...
    start "Thai SmartCard Agent" /min "%~dp0smartcard-agent\start.bat"
)

