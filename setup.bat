@echo off
chcp 65001 >nul
title POS System - Setup & Start
color 0B

echo.
echo  ╔═══════════════════════════════════════════════════════════╗
echo  ║         🏪 POS System - Setup ^& Start                    ║
echo  ╚═══════════════════════════════════════════════════════════╝
echo.

REM =============================================
REM STEP 1: ตรวจสอบว่า Docker รันอยู่หรือไม่
REM =============================================
echo  [1/6] ตรวจสอบ Docker...

REM ตรวจสอบว่า Docker ติดตั้งอยู่หรือไม่ (ลองทั้ง where และ docker -v)
where docker >nul 2>&1
set WHERE_DOCKER=%errorlevel%
docker -v >nul 2>&1
set DOCKER_V=%errorlevel%

if %WHERE_DOCKER% neq 0 if %DOCKER_V% neq 0 (
    echo        ⚠️ ไม่พบ Docker Desktop ในระบบ
    set /p choice="       📥 ลิงก์ดาวน์โหลดไม่ทำงาน คุณต้องการข้ามการติดตั้งนี้หรือไม่? (Y/N): "
    if /i "%choice%"=="Y" goto skip_docker_install
    
    echo        📥 กำลังพยายามดาวน์โหลด Docker Desktop...
    
    REM ใช้ PowerShell ดาวน์โหลดและตรวจสอบผลลัพธ์
    powershell -Command "$p = Join-Path $env:TEMP 'DockerInstaller'; if (!(Test-Path $p)) { New-Item -ItemType Directory -Path $p }; write-host '       ⏳ กำลังดาวน์โหลด... (ประมาณ 600MB อาจใช้เวลาสักครู่)'; [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; try { $url = 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe'; $out = Join-Path $p 'DockerDesktopInstaller.exe'; Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing -ErrorAction Stop; if (Test-Path $out) { write-host '       ✅ ดาวน์โหลดเสร็จสิ้น' } else { throw 'Download failed' } } catch { write-host '       ❌ ERROR: ' $_.Exception.Message; exit 1 }"
    
    if errorlevel 1 (
        color 0C
        echo.
        echo  ❌ ERROR: ไม่สามารถดาวน์โหลด Docker Desktop ได้อัตโนมัติ
        echo  กรุณาดาวน์โหลดเองที่: https://www.docker.com/products/docker-desktop
        echo  หลังจากติดตั้งเสร็จแล้ว ให้รันไฟล์นี้ใหม่อีกครั้ง
        echo.
        pause
        exit /b 1
    )
    
    if not exist "%TEMP%\DockerInstaller\DockerDesktopInstaller.exe" (
        color 0C
        echo.
        echo  ❌ ERROR: ไม่พบไฟล์ติดตั้งใน %TEMP%\DockerInstaller\DockerDesktopInstaller.exe
        echo  กรุณาลองรันไฟล์นี้ใหม่อีกครั้ง หรือติดตั้ง Docker ด้วยตนเอง
        echo.
        pause
        exit /b 1
    )

    echo        📦 กำลังติดตั้ง Docker Desktop...
    echo        (กรุณารอและเลือก 'OK' ในหน้าต่างติดตั้งที่ปรากฏขึ้น)
    
    REM รันตัวติดตั้งแบบกึ่งอัตโนมัติ (เอา --quiet ออกเพื่อให้ผู้ใช้เห็นความคืบหน้าถ้าต้องการ)
    start /wait "" "%TEMP%\DockerInstaller\DockerDesktopInstaller.exe" install --accept-license
    
    if errorlevel 1 (
        echo        ⚠️ การติดตั้งอาจไม่สมบูรณ์ หรือถูกยกเลิก
        pause
    ) else (
        echo        ✅ ติดตั้ง Docker Desktop เรียบร้อย
        echo        🔄 กรุณารีสตาร์ทเครื่อง (ถ้าจำเป็น) และรันไฟล์นี้ใหม่อีกครั้ง
        pause
    )
    exit /b 0
)

:skip_docker_install

REM ตรวจสอบว่า Docker กำลังรันอยู่หรือไม่
docker info >nul 2>&1
if errorlevel 1 (
    echo        ⚠️ Docker Desktop ยังไม่ได้เปิด
    echo        🚀 กำลังเปิด Docker Desktop...
    
    REM เปิด Docker Desktop
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    echo        ⏳ กำลังรอ Docker เริ่มต้น... (อาจใช้เวลา 30-60 วินาที)
    
    REM รอให้ Docker พร้อม (สูงสุด 120 วินาที)
    set /a count=0
    :wait_docker
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if errorlevel 1 (
        set /a count+=1
        if %count% lss 24 (
            echo        ⏳ รอ Docker... (%count%/24)
            goto wait_docker
        ) else (
            color 0C
            echo.
            echo  ❌ ERROR: Docker ไม่สามารถเริ่มต้นได้ภายใน 2 นาที
            echo  กรุณาเปิด Docker Desktop ด้วยตนเองและรันไฟล์นี้ใหม่
            echo.
            pause
            exit /b 1
        )
    )
)
echo        ✅ Docker กำลังทำงาน

REM =============================================
REM STEP 2: หยุด Containers เก่า (ถ้ามี)
REM =============================================
echo  [2/6] หยุด Containers เก่า (ถ้ามี)...
docker-compose down >nul 2>&1
echo        ✅ พร้อมแล้ว

REM =============================================
REM STEP 3: สร้างโฟลเดอร์ที่จำเป็น
REM =============================================
echo  [3/6] สร้างโฟลเดอร์ข้อมูล...
if not exist "pg-data" mkdir pg-data
if not exist "uploads" mkdir uploads
echo        ✅ พร้อมแล้ว

REM =============================================
REM STEP 4: รัน docker-compose up -d
REM =============================================
echo  [4/6] เริ่มต้น Containers...
docker-compose up -d --build
if errorlevel 1 (
    color 0C
    echo.
    echo  ❌ ERROR: ไม่สามารถเริ่ม Containers ได้
    echo.
    pause
    exit /b 1
)
echo        ✅ Containers เริ่มทำงานแล้ว

REM =============================================
REM STEP 5: รอและสั่ง Prisma DB Push
REM =============================================
echo  [5/6] รอ Database พร้อม...
echo        (กรุณารอสักครู่...)

REM รอให้ Database พร้อม
timeout /t 10 /nobreak >nul

REM ตรวจสอบว่า postgres พร้อมหรือยัง
:wait_db
docker exec pos-postgres-smile pg_isready -U myuser -d po_database >nul 2>&1
if errorlevel 1 (
    echo        ⏳ กำลังรอ Database...
    timeout /t 3 /nobreak >nul
    goto wait_db
)
echo        ✅ Database พร้อมแล้ว

echo        สร้างตารางใน Database (Prisma)...
docker exec pos-app-smile npx prisma db push --skip-generate
if errorlevel 1 (
    echo        ⚠️ Warning: Prisma db push อาจมีปัญหา (อาจเป็นเพราะตารางมีอยู่แล้ว)
) else (
    echo        ✅ สร้างตารางเรียบร้อย
)

REM =============================================
REM STEP 6: แสดง IP Address
REM =============================================
echo  [6/6] เสร็จสิ้น!
echo.
echo  ╔═══════════════════════════════════════════════════════════╗
echo  ║         ✅ POS System พร้อมใช้งานแล้ว!                    ║
echo  ╚═══════════════════════════════════════════════════════════╝
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
echo  📱 วิธีเข้าใช้งาน:
echo.
echo     ระบบ POS:      http://localhost:4000
echo     จัดการ Database:  http://localhost:5050 (pgAdmin)
echo.
echo     (เครื่องอื่นในวง LAN เข้าผ่าน Port เดียวกัน)
echo.
echo  💡 นำ IP ไปกรอกใน Launcher ของเครื่องลูกได้เลย!
echo.
echo  🔐 ข้อมูล Login pgAdmin:
echo     Email:    admin@admin.com
echo     Password: admin
echo  ═══════════════════════════════════════════════════════════════
echo.
pause
