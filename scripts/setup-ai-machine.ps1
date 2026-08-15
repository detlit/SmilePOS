<#
.SYNOPSIS
    เฟส 0 ขั้นที่ 1 — สำรวจ + ปรับจูนเครื่อง POS ให้พร้อมวัดผล AI

.DESCRIPTION
    โหมดเริ่มต้น = อ่านอย่างเดียว (ไม่แก้อะไรทั้งสิ้น) เก็บ baseline ลง
    scratch/ai-machine-baseline.json เพื่อให้ bench-ai.mjs กับรายงานอ้างอิงได้

    ใส่ -Apply ถึงจะเริ่มแก้เครื่อง:
      1. power plan -> High performance + PROCTHROTTLEMIN 100% (ตอน AC)
      2. ~/.wslconfig จำกัด RAM/CPU ของ WSL2   (สำรองไฟล์เดิมไว้เสมอ)
      3. ตัวแปรสภาพแวดล้อมของ Ollama (ระดับ user)

    -Revert คืนค่า power plan เดิม + .wslconfig เดิม จาก baseline ที่บันทึกไว้

.PARAMETER Apply
    ลงมือแก้จริง (ต้องรัน PowerShell แบบ Run as Administrator)

.PARAMETER Revert
    คืนค่าเดิมจาก scratch/ai-machine-baseline.json

.PARAMETER WslMemoryMB
    เพดาน RAM ของ WSL2 (ค่าเริ่มต้น 1536 MB) — ต่ำไปจะทำ Postgres ช้า
    สูงไปจะไม่เหลือ RAM ให้โมเดล ปรับได้ตามผลวัดจริง

.PARAMETER RestartWsl
    สั่ง wsl --shutdown หลังเขียน .wslconfig
    !! ตัวนี้จะดับคอนเทนเนอร์ Docker ทั้งหมดรวมถึง pos-postgres-smileP
       ทำตอนปิดร้าน / ไม่มีคนขายของเท่านั้น

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts\setup-ai-machine.ps1
    powershell -ExecutionPolicy Bypass -File scripts\setup-ai-machine.ps1 -Apply
    powershell -ExecutionPolicy Bypass -File scripts\setup-ai-machine.ps1 -Revert
#>

[CmdletBinding()]
param(
    [switch]$Apply,
    [switch]$Revert,
    [int]$WslMemoryMB = 1536,
    [int]$WslProcessors = 2,
    [switch]$RestartWsl,
    [string]$OllamaKeepAlive = '30m'
)

$ErrorActionPreference = 'Stop'
$ProjectRoot   = Split-Path -Parent $PSScriptRoot
$ScratchDir    = Join-Path $ProjectRoot 'scratch'
$BaselinePath  = Join-Path $ScratchDir 'ai-machine-baseline.json'
$WslConfigPath = Join-Path $env:USERPROFILE '.wslconfig'

if (-not (Test-Path $ScratchDir)) { New-Item -ItemType Directory -Path $ScratchDir | Out-Null }

function Write-Head($text) {
    Write-Host ''
    Write-Host ('=' * 68) -ForegroundColor DarkGray
    Write-Host "  $text" -ForegroundColor Cyan
    Write-Host ('=' * 68) -ForegroundColor DarkGray
}
function Write-Row($label, $value, $color = 'White') {
    Write-Host ("  {0,-28} " -f $label) -NoNewline -ForegroundColor Gray
    Write-Host $value -ForegroundColor $color
}
function Test-Admin {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    $pr = New-Object Security.Principal.WindowsPrincipal($id)
    return $pr.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# ---------------------------------------------------------------------------
# เดาความสามารถชุดคำสั่ง SIMD จากรุ่น CPU
# ค่าที่ชี้ขาดจริงคือ log ของ ollama serve (ดูฟังก์ชัน Get-OllamaCpuVariant)
# ---------------------------------------------------------------------------
function Get-SimdGuess($caption, $manufacturer) {
    $result = [ordered]@{ avx = $null; avx2 = $null; note = '' }

    if ($caption -match 'Family\s+(\d+)\s+Model\s+(\d+)') {
        $family = [int]$Matches[1]
        $model  = [int]$Matches[2]

        if ($manufacturer -match 'Intel') {
            # Atom/Silvermont/Goldmont — ไม่มี AVX เลย
            $atomModels = @(28, 38, 39, 53, 54, 55, 74, 76, 77, 90, 92, 93, 95, 122, 134)
            if ($family -eq 6 -and $atomModels -contains $model) {
                $result.avx = $false; $result.avx2 = $false
                $result.note = 'Intel Atom class — ไม่มี AVX เลย รัน LLM ไม่ไหวแน่นอน'
            }
            elseif ($family -eq 6 -and $model -ge 42 -and $model -le 62) {
                # Sandy Bridge (42,45) / Ivy Bridge (58,62)
                $result.avx = $true; $result.avx2 = $false
                $result.note = 'Sandy/Ivy Bridge — มี AVX1 แต่ไม่มี AVX2/FMA (llama.cpp ช้ากว่าปกติ ~2 เท่า)'
            }
            elseif ($family -eq 6 -and $model -ge 60) {
                $result.avx = $true; $result.avx2 = $true
                $result.note = 'Haswell ขึ้นไป — มี AVX2/FMA'
            }
        }
        elseif ($manufacturer -match 'AMD') {
            if ($family -ge 23) {
                $result.avx = $true; $result.avx2 = $true
                $result.note = 'AMD Zen ขึ้นไป — มี AVX2/FMA'
            }
            elseif ($family -ge 21) {
                $result.avx = $true; $result.avx2 = $false
                $result.note = 'AMD Bulldozer/Jaguar — AVX1 เท่านั้น'
            }
        }
    }

    if ($null -eq $result.avx2) {
        $result.note = 'ระบุรุ่นไม่ได้ — ให้ยืนยันจาก log ของ ollama serve แทน'
    }
    return $result
}

# ---------------------------------------------------------------------------
# อ่าน log ของ Ollama เพื่อดูว่ามันเลือก build ไหน (cpu / cpu_avx / cpu_avx2)
# นี่คือหลักฐานชี้ขาด ไม่ใช่การเดา
# ---------------------------------------------------------------------------
function Get-OllamaCpuVariant {
    $logPath = Join-Path $env:LOCALAPPDATA 'Ollama\server.log'
    if (-not (Test-Path $logPath)) { return $null }
    try {
        $hits = Select-String -Path $logPath -Pattern 'cpu(_avx2?)?' -AllMatches |
                Select-Object -Last 20
        foreach ($h in $hits) {
            if ($h.Line -match '(variant|library)[=\s"]+(cpu_avx2|cpu_avx|cpu)\b') { return $Matches[2] }
        }
    } catch { }
    return $null
}

# ---------------------------------------------------------------------------
# วัดคล็อกจริงตอนมีโหลด — เผยให้เห็นว่าโดน throttle อยู่หรือไม่
# ---------------------------------------------------------------------------
function Measure-CpuClock {
    param([int]$Seconds = 4)

    $cpu    = Get-CimInstance Win32_Processor | Select-Object -First 1
    $maxMhz = [int]$cpu.MaxClockSpeed

    # โหลด CPU เบาๆ เพื่อเรียก turbo ขึ้นมา (จำกัดไม่เกิน 4 job เพราะแต่ละ job = 1 process)
    $loadJobs = [math]::Min($cpu.NumberOfLogicalProcessors, 4)
    $jobs = @()
    for ($i = 0; $i -lt $loadJobs; $i++) {
        $jobs += Start-Job -ScriptBlock {
            param($sec)
            $end = (Get-Date).AddSeconds($sec)
            $x = 0.0
            while ((Get-Date) -lt $end) { for ($k = 0; $k -lt 200000; $k++) { $x = $x + [math]::Sqrt($k) } }
        } -ArgumentList ($Seconds + 1)
    }

    Start-Sleep -Milliseconds 1200
    $samples = @()
    for ($s = 0; $s -lt 3; $s++) {
        $mhz = $null
        try {
            $perf = (Get-Counter '\Processor Information(_Total)\% Processor Performance' -ErrorAction Stop).CounterSamples[0].CookedValue
            $mhz  = [math]::Round($maxMhz * $perf / 100)
        } catch {
            # Windows ภาษาไทย/ชื่อ counter ต่างออกไป -> ถอยไปใช้ WMI
            $mhz = [int](Get-CimInstance Win32_Processor | Select-Object -First 1).CurrentClockSpeed
        }
        if ($mhz -gt 0) { $samples += $mhz }
        Start-Sleep -Milliseconds 700
    }

    $jobs | ForEach-Object { Stop-Job $_ -ErrorAction SilentlyContinue; Remove-Job $_ -Force -ErrorAction SilentlyContinue }

    if ($samples.Count -eq 0) { return @{ loadedMhz = 0; maxMhz = $maxMhz } }
    $avg = [math]::Round(($samples | Measure-Object -Average).Average)
    return @{ loadedMhz = $avg; maxMhz = $maxMhz; samples = $samples }
}

function Get-MachineSnapshot {
    $cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
    $os  = Get-CimInstance Win32_OperatingSystem
    $gpu = Get-CimInstance Win32_VideoController

    $activeScheme = (powercfg /getactivescheme) -join ' '
    $schemeGuid = ''
    if ($activeScheme -match '([0-9a-fA-F\-]{36})') { $schemeGuid = $Matches[1] }

    $simd = Get-SimdGuess $cpu.Caption $cpu.Manufacturer

    return [ordered]@{
        timestamp        = (Get-Date).ToString('s')
        computerName     = $env:COMPUTERNAME
        os               = $os.Caption
        cpuName          = $cpu.Name.Trim()
        cpuCaption       = $cpu.Caption
        cores            = $cpu.NumberOfCores
        threads          = $cpu.NumberOfLogicalProcessors
        maxClockMhz      = $cpu.MaxClockSpeed
        currentClockMhz  = $cpu.CurrentClockSpeed
        simdAvx          = $simd.avx
        simdAvx2         = $simd.avx2
        simdNote         = $simd.note
        ollamaCpuVariant = Get-OllamaCpuVariant
        ramTotalMB       = [math]::Round($os.TotalVisibleMemorySize / 1KB)
        ramFreeMB        = [math]::Round($os.FreePhysicalMemory / 1KB)
        gpus             = @($gpu | ForEach-Object { $_.Name })
        powerSchemeGuid  = $schemeGuid
        powerSchemeName  = $activeScheme
        wslConfigExists  = (Test-Path $WslConfigPath)
        wslConfigContent = $(if (Test-Path $WslConfigPath) { Get-Content $WslConfigPath -Raw } else { $null })
        ollamaInstalled  = [bool](Get-Command ollama -ErrorAction SilentlyContinue)
        nodeVersion      = $(try { (node --version) } catch { $null })
    }
}

# ===========================================================================
# REVERT
# ===========================================================================
if ($Revert) {
    Write-Head 'คืนค่าเดิม (Revert)'
    if (-not (Test-Path $BaselinePath)) {
        Write-Host "  ไม่พบ $BaselinePath — ไม่มีข้อมูลให้คืนค่า" -ForegroundColor Red
        exit 1
    }
    if (-not (Test-Admin)) {
        Write-Host '  ต้องรันแบบ Run as Administrator' -ForegroundColor Red
        exit 1
    }

    $base = Get-Content $BaselinePath -Raw | ConvertFrom-Json

    if ($base.before.powerSchemeGuid) {
        powercfg /setactive $base.before.powerSchemeGuid
        Write-Row 'power plan' "คืนค่าเป็น $($base.before.powerSchemeGuid)" Green
    }

    if ($base.before.wslConfigContent) {
        Set-Content -Path $WslConfigPath -Value $base.before.wslConfigContent -Encoding utf8
        Write-Row '.wslconfig' 'คืนค่าเนื้อหาเดิม' Green
    } elseif (Test-Path $WslConfigPath) {
        Remove-Item $WslConfigPath -Force
        Write-Row '.wslconfig' 'ลบทิ้ง (เดิมไม่มีไฟล์นี้)' Green
    }

    foreach ($name in @('OLLAMA_KEEP_ALIVE', 'OLLAMA_NUM_PARALLEL', 'OLLAMA_MAX_LOADED_MODELS')) {
        [Environment]::SetEnvironmentVariable($name, $null, 'User')
    }
    Write-Row 'ตัวแปร OLLAMA_*' 'ลบออกจาก user environment' Green

    Write-Host ''
    Write-Host '  เสร็จแล้ว — ต้อง log off/reboot ให้ค่าใหม่มีผลครบ' -ForegroundColor Yellow
    exit 0
}

# ===========================================================================
# สำรวจ (ทำเสมอ)
# ===========================================================================
Write-Head 'เฟส 0 · ขั้นที่ 1 — สำรวจเครื่อง'

$before = Get-MachineSnapshot

Write-Row 'เครื่อง'            "$($before.computerName)  ($($before.os))"
Write-Row 'CPU'                $before.cpuName
Write-Row 'คอร์ / เธรด'         "$($before.cores) / $($before.threads)" $(if ($before.cores -lt 4) { 'Yellow' } else { 'Green' })
Write-Row 'คล็อกสูงสุด (nominal)' "$($before.maxClockMhz) MHz"
Write-Row 'คล็อกตอนนี้ (idle)'  "$($before.currentClockMhz) MHz"

$avx2Text  = if ($null -eq $before.simdAvx2) { 'ไม่แน่ใจ' } elseif ($before.simdAvx2) { 'มี' } else { 'ไม่มี' }
$avx2Color = if ($before.simdAvx2) { 'Green' } else { 'Yellow' }
Write-Row 'AVX2 / FMA (เดาจากรุ่น)' $avx2Text $avx2Color
if ($before.simdNote) { Write-Host "                               $($before.simdNote)" -ForegroundColor DarkGray }

if ($before.ollamaCpuVariant) {
    Write-Row 'Ollama เลือก build' $before.ollamaCpuVariant $(if ($before.ollamaCpuVariant -eq 'cpu_avx2') { 'Green' } else { 'Yellow' })
} else {
    Write-Host '                               (ยังอ่าน log ของ ollama ไม่ได้ — รัน ollama serve ก่อนแล้วสั่งสคริปต์นี้ซ้ำ)' -ForegroundColor DarkGray
}

Write-Row 'RAM ทั้งหมด'         "$($before.ramTotalMB) MB"
Write-Row 'RAM ว่าง'            "$($before.ramFreeMB) MB" $(if ($before.ramFreeMB -lt 2048) { 'Red' } elseif ($before.ramFreeMB -lt 3072) { 'Yellow' } else { 'Green' })
foreach ($g in $before.gpus) { Write-Row 'GPU' $g }
Write-Row 'power plan'          $before.powerSchemeName
Write-Row '.wslconfig'          $(if ($before.wslConfigExists) { 'มีอยู่แล้ว' } else { 'ยังไม่มี' })
Write-Row 'Ollama'              $(if ($before.ollamaInstalled) { 'ติดตั้งแล้ว' } else { 'ยังไม่ได้ติดตั้ง' })
Write-Row 'Node.js'             $(if ($before.nodeVersion) { $before.nodeVersion } else { 'ไม่พบ' })

Write-Head 'วัดคล็อกจริงตอนมีโหลด (ก่อนปรับ)'
Write-Host '  กำลังโหลด CPU ~5 วินาที...' -ForegroundColor DarkGray
$clockBefore = Measure-CpuClock -Seconds 4
Write-Row 'คล็อกเฉลี่ยตอนมีโหลด' "$($clockBefore.loadedMhz) MHz"
$ratio = if ($clockBefore.maxMhz -gt 0) { [math]::Round($clockBefore.loadedMhz * 100 / $clockBefore.maxMhz) } else { 0 }
Write-Row 'คิดเป็น'              "$ratio % ของ nominal" $(if ($ratio -lt 80) { 'Red' } elseif ($ratio -lt 100) { 'Yellow' } else { 'Green' })
if ($ratio -lt 80) {
    Write-Host '  >> โดนลดคล็อกอยู่จริง การปรับ power plan น่าจะได้ความเร็วเพิ่มชัดเจน' -ForegroundColor Yellow
}

# ===========================================================================
# APPLY
# ===========================================================================
$applied = [ordered]@{ powerPlan = $false; wslConfig = $false; ollamaEnv = $false; wslRestarted = $false }
$clockAfter = $null

if ($Apply) {
    if (-not (Test-Admin)) {
        Write-Host ''
        Write-Host '  -Apply ต้องรัน PowerShell แบบ Run as Administrator' -ForegroundColor Red
        Write-Host '  (โหมดสำรวจข้างบนทำงานครบแล้ว ผลถูกบันทึกไว้)' -ForegroundColor DarkGray
        $Apply = $false
    }
}

if ($Apply) {
    Write-Head 'ขั้นที่ 1.1 — power plan'
    powercfg /setactive SCHEME_MIN                                              # High performance
    powercfg /setacvalueindex SCHEME_CURRENT SUB_PROCESSOR PROCTHROTTLEMIN 100  # ไม่ลดคล็อกตอนเสียบไฟ
    powercfg /setacvalueindex SCHEME_CURRENT SUB_PROCESSOR PROCTHROTTLEMAX 100
    powercfg /setactive SCHEME_CURRENT
    $applied.powerPlan = $true
    Write-Row 'power plan' 'High performance + min/max processor state 100% (AC)' Green
    Write-Host '  หมายเหตุ: ตั้งเฉพาะตอนเสียบไฟ ตอนใช้แบตยังประหยัดเหมือนเดิม' -ForegroundColor DarkGray

    Write-Head 'ขั้นที่ 1.2 — .wslconfig'
    if (Test-Path $WslConfigPath) {
        $bak = "$WslConfigPath.bak-$((Get-Date).ToString('yyyyMMdd-HHmmss'))"
        Copy-Item $WslConfigPath $bak
        Write-Row 'สำรองไฟล์เดิม' $bak DarkGray
    }
    $wslBody = @"
# ปรับโดย scripts/setup-ai-machine.ps1 (เฟส 0 ของฟีเจอร์ผู้ช่วย AI)
# จำกัด WSL2 เพื่อกันไม่ให้ Docker/Postgres กิน RAM จนไม่เหลือให้โมเดล
# คืนค่าเดิมได้ด้วย: setup-ai-machine.ps1 -Revert
[wsl2]
memory=${WslMemoryMB}MB
processors=$WslProcessors
swap=0
"@
    Set-Content -Path $WslConfigPath -Value $wslBody -Encoding utf8
    $applied.wslConfig = $true
    Write-Row '.wslconfig' "memory=${WslMemoryMB}MB, processors=$WslProcessors, swap=0" Green

    if ($RestartWsl) {
        Write-Host '  กำลัง wsl --shutdown (Docker/Postgres จะดับชั่วคราว)...' -ForegroundColor Yellow
        wsl --shutdown
        $applied.wslRestarted = $true
        Write-Row 'wsl --shutdown' 'เรียบร้อย — สั่ง Docker Desktop ขึ้นใหม่ด้วย' Green
    } else {
        Write-Host '  ยังไม่ได้ restart WSL — ค่าใหม่จะมีผลหลัง wsl --shutdown หรือ reboot' -ForegroundColor Yellow
        Write-Host '  (ทำตอนปิดร้าน เพราะคอนเทนเนอร์ pos-postgres-smileP จะดับ)' -ForegroundColor DarkGray
    }

    Write-Head 'ขั้นที่ 1.3 — ตัวแปรของ Ollama'
    [Environment]::SetEnvironmentVariable('OLLAMA_KEEP_ALIVE', $OllamaKeepAlive, 'User')
    [Environment]::SetEnvironmentVariable('OLLAMA_NUM_PARALLEL', '1', 'User')
    [Environment]::SetEnvironmentVariable('OLLAMA_MAX_LOADED_MODELS', '1', 'User')
    $applied.ollamaEnv = $true
    Write-Row 'OLLAMA_KEEP_ALIVE'        $OllamaKeepAlive Green
    Write-Row 'OLLAMA_NUM_PARALLEL'      '1' Green
    Write-Row 'OLLAMA_MAX_LOADED_MODELS' '1' Green
    Write-Host '  ต้องปิด Ollama แล้วเปิดใหม่ ค่าถึงจะมีผล' -ForegroundColor Yellow

    Write-Head 'วัดคล็อกจริงตอนมีโหลด (หลังปรับ)'
    Write-Host '  กำลังโหลด CPU ~5 วินาที...' -ForegroundColor DarkGray
    $clockAfter = Measure-CpuClock -Seconds 4
    $gain = if ($clockBefore.loadedMhz -gt 0) { [math]::Round($clockAfter.loadedMhz * 100.0 / $clockBefore.loadedMhz - 100, 1) } else { 0 }
    Write-Row 'คล็อกเฉลี่ยตอนมีโหลด' "$($clockAfter.loadedMhz) MHz"
    Write-Row 'เปลี่ยนแปลง'          "$gain %" $(if ($gain -gt 5) { 'Green' } else { 'Yellow' })
}

# ===========================================================================
# บันทึก baseline
# ===========================================================================
$after = Get-MachineSnapshot
$report = [ordered]@{
    schemaVersion = 1
    mode          = $(if ($Apply) { 'apply' } else { 'inspect' })
    before        = $before
    after         = $after
    applied       = $applied
    clockLoadedBeforeMhz = $clockBefore.loadedMhz
    clockLoadedAfterMhz  = $(if ($clockAfter) { $clockAfter.loadedMhz } else { $null })
}
$report | ConvertTo-Json -Depth 6 | Out-File -FilePath $BaselinePath -Encoding utf8

Write-Head 'สรุป'
Write-Row 'บันทึกผลไว้ที่' $BaselinePath Green

# --- ตรวจความพร้อมก่อนไปขั้นถัดไป ---
$blockers = @()
if (-not $after.ollamaInstalled) { $blockers += 'ยังไม่ได้ติดตั้ง Ollama -> https://ollama.com/download' }
if (-not $after.nodeVersion)     { $blockers += 'ไม่พบ Node.js (ต้อง v18+ เพื่อรัน bench-ai.mjs)' }
if ($after.ramFreeMB -lt 1800)   { $blockers += "RAM ว่างแค่ $($after.ramFreeMB) MB — ปิดโปรแกรมที่ไม่ใช้ก่อนวัด" }
if (-not $Apply)                 { $blockers += 'ยังไม่ได้ปรับเครื่อง — รันซ้ำด้วย -Apply (Run as Administrator)' }

if ($blockers.Count -gt 0) {
    Write-Host ''
    Write-Host '  ต้องทำก่อนไปขั้นที่ 2:' -ForegroundColor Yellow
    foreach ($b in $blockers) { Write-Host "    - $b" -ForegroundColor Yellow }
} else {
    Write-Host ''
    Write-Host '  พร้อมไปขั้นที่ 2 แล้ว:' -ForegroundColor Green
    Write-Host '    ollama pull qwen2.5:1.5b-instruct-q4_K_M' -ForegroundColor Gray
    Write-Host '    ollama pull qwen3:0.6b' -ForegroundColor Gray
    Write-Host '    node scripts\bench-ai.mjs' -ForegroundColor Gray
}
Write-Host ''
