<#
.SYNOPSIS
    ติดตั้ง/ถอน Windows Scheduled Task สำหรับ autosave ขึ้น GitHub ทุก 30 นาที

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts\install-autosave-task.ps1
    powershell -ExecutionPolicy Bypass -File scripts\install-autosave-task.ps1 -Uninstall
    powershell -ExecutionPolicy Bypass -File scripts\install-autosave-task.ps1 -IntervalMinutes 15

.NOTES
    ไม่ต้องรันเป็น Administrator — สร้าง task ใต้บัญชีผู้ใช้ปัจจุบัน
    task จะทำงานเฉพาะตอนล็อกอินอยู่ (ไม่ต้องเก็บรหัสผ่านไว้ในระบบ)
#>

[CmdletBinding()]
param(
    [int]$IntervalMinutes = 30,
    [switch]$Uninstall
)

$ErrorActionPreference = 'Stop'

$TaskName   = 'SmileStore-GitAutosave'
$RepoPath   = Split-Path -Parent $PSScriptRoot
$ScriptPath = Join-Path $PSScriptRoot 'git-autosave.ps1'

# ── ถอนการติดตั้ง ────────────────────────────────────────────
if ($Uninstall) {
    try {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction Stop
        Write-Host "✅ ถอน task '$TaskName' เรียบร้อย" -ForegroundColor Green
    } catch {
        Write-Host "ℹ️  ไม่พบ task '$TaskName' อยู่แล้ว" -ForegroundColor Yellow
    }
    return
}

if (-not (Test-Path $ScriptPath)) { throw "ไม่พบสคริปต์ autosave ที่ $ScriptPath" }

Write-Host ""
Write-Host "  ติดตั้ง Git Autosave" -ForegroundColor Cyan
Write-Host "  repo     : $RepoPath"
Write-Host "  ทุก      : $IntervalMinutes นาที"
Write-Host "  สคริปต์  : $ScriptPath"
Write-Host ""

# ลบของเดิมก่อน (ถ้ามี) เพื่อให้ติดตั้งซ้ำได้เสมอ
try { Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction Stop } catch { }

$action = New-ScheduledTaskAction `
    -Execute 'powershell.exe' `
    -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`"" `
    -WorkingDirectory $RepoPath

# trigger 2 ตัว:
#   1) วนทุก N นาที ไม่มีวันหมดอายุ — ตั้งใจไม่ใส่ -RepetitionDuration
#      เพราะ [TimeSpan]::MaxValue จะได้ P99999999DT23H59M59S ซึ่ง Task Scheduler ปฏิเสธ
#      ปล่อยว่างไว้ = ทำซ้ำไปเรื่อย ๆ
#   2) เริ่มใหม่ตอนล็อกอิน เผื่อรีสตาร์ตเครื่อง
$triggerRepeat = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) `
    -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes)

$triggerLogon = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"
$triggerLogon.Delay = 'PT2M'   # หน่วง 2 นาทีหลังล็อกอิน ให้เครื่องนิ่งก่อน

$trigger = @($triggerRepeat, $triggerLogon)

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 10) `
    -RestartCount 2 `
    -RestartInterval (New-TimeSpan -Minutes 5)

$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "Snapshot โปรเจกต์ SmileStore POS ขึ้น GitHub ทุก $IntervalMinutes นาที (branch autosave/<เครื่อง>) โดยไม่รบกวน working tree" | Out-Null

Write-Host "✅ สร้าง task '$TaskName' เรียบร้อย" -ForegroundColor Green
Write-Host ""
Write-Host "คำสั่งที่ใช้บ่อย:" -ForegroundColor Cyan
Write-Host "  สั่งรันทันที   : Start-ScheduledTask -TaskName '$TaskName'"
Write-Host "  ดูสถานะ        : Get-ScheduledTaskInfo -TaskName '$TaskName'"
Write-Host "  ดู log         : Get-Content `"$env:LOCALAPPDATA\SmileStoreAutosave\autosave.log`" -Tail 30"
Write-Host "  ถอนการติดตั้ง  : .\scripts\install-autosave-task.ps1 -Uninstall"
Write-Host ""

# เริ่มรอบแรกให้เลย จะได้รู้ผลทันทีว่าตั้งค่าถูกไหม
Write-Host "กำลังทดสอบรันรอบแรก..." -ForegroundColor Cyan
Start-ScheduledTask -TaskName $TaskName
Start-Sleep -Seconds 8
$log = Join-Path $env:LOCALAPPDATA 'SmileStoreAutosave\autosave.log'
if (Test-Path $log) { Get-Content $log -Tail 6 } else { Write-Host "(ยังไม่มี log — ลองดูใหม่อีกสักครู่)" -ForegroundColor Yellow }
