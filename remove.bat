@echo off
chcp 65001 >nul
title POS System - Rebuild Containers
color 0B

echo.
echo  ╔═══════════════════════════════════════════════════════════╗
echo  ║        🔄 POS System - Rebuild & Update                   ║
echo  ╚═══════════════════════════════════════════════════════════╝
echo.

echo  [1/5] หยุด Containers เดิม...
docker compose down
echo        ✅ เสร็จสิ้น

echo  [2/5] เคลียร์ Cache (เพื่อให้มั่นใจว่าได้โค้ดล่าสุด)...
docker builder prune -f
echo        ✅ เสร็จสิ้น

echo  [3/5] Build และเริ่มระบบใหม่...
:: ใช้ --build เพื่อบังคับสร้างใหม่ในคำสั่งเดียว
docker compose up -d --build
echo        ✅ เสร็จสิ้น

echo  [4/5] รอ Database เริ่มทำงาน (10 วินาที)...
timeout /t 10 /nobreak >nul

echo  [5/5] อัปเดตโครงสร้าง Database (Prisma)...
:: สั่งคำสั่งเข้าไปใน Container ชื่อ pos-app-smile (แก้ตามชื่อใน docker-compose ถ้าไม่ตรง)
docker compose exec -T app npx prisma db push
echo        ✅ เสร็จสิ้น

REM =============================================
REM STEP 6: แสดง IP Address
REM =============================================
echo.
echo  ╔═══════════════════════════════════════════════════════════╗
echo  ║         ✅ POS System พร้อมใช้งานแล้ว!                    ║
echo  ╚═══════════════════════════════════════════════════════════╝
echo.
echo  📍 ข้อมูลการเชื่อมต่อ:
echo  ─────────────────────────────────────────────────────────────
echo.
echo  [1] ภายในร้าน (LAN):
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        echo      - เครื่องลูก/มือถือ:  http://%%b:4000
    )
)
echo      - เครื่องนี้ (Server): http://localhost:4000
echo.
echo  [2] นอกร้าน (Cloudflare Tunnel):
echo      - ลิงก์ออนไลน์:        https://klangya.smilepharmacylocal.com
echo.
echo  ─────────────────────────────────────────────────────────────
echo.
echo  💡 นำ IP หรือ ลิงก์ ไปใช้งานได้เลย!
echo.
pause