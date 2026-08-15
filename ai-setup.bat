@echo off
REM ===========================================================
REM  Smile Pharmacy - AI Assistant Phase 0 Setup Launcher
REM  Double-click this file to open the menu.
REM  All logic lives in scripts\ai-phase0-menu.ps1
REM ===========================================================
chcp 65001 >nul 2>&1
cd /d "%~dp0"
title Smile Pharmacy - AI Phase 0

where powershell >nul 2>&1
if errorlevel 1 (
    echo [ERROR] PowerShell not found on this machine.
    pause
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\ai-phase0-menu.ps1" %*

if errorlevel 1 (
    echo.
    echo [ERROR] Script exited with an error. See the message above.
    pause
)
