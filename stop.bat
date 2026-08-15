@echo off
chcp 65001 >nul
title Stopping POS System

echo =============================================
echo       Stopping POS System...
echo =============================================
echo.

docker-compose down

if errorlevel 1 (
    echo [ERROR] Failed to stop POS System!
    pause
    exit /b 1
)

echo.
echo POS System stopped successfully.
echo.
echo Data is preserved in ./pg-data folder.
echo.
timeout /t 3 /nobreak >nul
