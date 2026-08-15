<#
    เมนูสำหรับเฟส 0 ของฟีเจอร์ผู้ช่วย AI
    เรียกจาก ai-setup.bat (ดับเบิลคลิก) — ไม่ต้องพิมพ์คำสั่งเอง

    ข้อความภาษาไทยอยู่ในไฟล์นี้ทั้งหมด ไม่ใช่ในไฟล์ .bat
    เพราะ cmd.exe แสดงภาษาไทยไม่นิ่ง แต่ PowerShell แสดงได้ถูกต้อง
#>

param(
    [string]$Step = '',
    [switch]$NoPause
)

$ErrorActionPreference = 'Stop'
$ProjectRoot   = Split-Path -Parent $PSScriptRoot
$SetupScript   = Join-Path $PSScriptRoot 'setup-ai-machine.ps1'
$BenchScript   = Join-Path $PSScriptRoot 'bench-ai.mjs'
$ScratchDir    = Join-Path $ProjectRoot 'scratch'
$QuestionsPath = Join-Path $ScratchDir 'ai-bench-questions.json'
$ResultPath    = Join-Path $ScratchDir 'ai-bench-result.json'
$ReportPath    = Join-Path $ScratchDir 'ai-bench-report.md'
$BaselinePath  = Join-Path $ScratchDir 'ai-machine-baseline.json'

$MainModel = 'qwen2.5:1.5b-instruct-q4_K_M'
$AltModel  = 'qwen3:0.6b'

try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

# ---------------------------------------------------------------------------
# ตัวช่วย
# ---------------------------------------------------------------------------
function Test-Admin {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    $pr = New-Object Security.Principal.WindowsPrincipal($id)
    return $pr.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Test-Port {
    param([string]$ComputerName = '127.0.0.1', [int]$Port = 11434)
    try {
        $c = New-Object Net.Sockets.TcpClient
        $iar = $c.BeginConnect($ComputerName, $Port, $null, $null)
        $wait = $iar.AsyncWaitHandle.WaitOne(800, $false)
        if ($wait -and $c.Connected) { $c.EndConnect($iar); $c.Close(); return $true }
        $c.Close()
        return $false
    } catch { return $false }
}

function Get-InstalledModels {
    if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) { return @() }
    try {
        $lines = & ollama list 2>$null
        $names = @()
        foreach ($l in $lines) {
            if ($l -match '^\s*NAME') { continue }
            $t = ($l -split '\s+')[0]
            if ($t) { $names += $t }
        }
        return $names
    } catch { return @() }
}

function Write-Title {
    Clear-Host
    Write-Host ''
    Write-Host '  ╔══════════════════════════════════════════════════════════════╗' -ForegroundColor Cyan
    Write-Host '  ║      ผู้ช่วย AI แบบ Local — เฟส 0 (วัดผลเครื่องจริง)          ║' -ForegroundColor Cyan
    Write-Host '  ╚══════════════════════════════════════════════════════════════╝' -ForegroundColor Cyan
    Write-Host ''
}

function Write-Status {
    $nodeVer   = $null
    try { $nodeVer = (& node --version 2>$null) } catch { }
    $nodeOk    = [bool]$nodeVer
    $ollamaOk  = [bool](Get-Command ollama -ErrorAction SilentlyContinue)
    $running   = Test-Port
    $models    = Get-InstalledModels
    $hasMain   = $models -contains $MainModel
    $hasAlt    = $models -contains $AltModel
    $adminOk   = Test-Admin
    $tunedOk   = $false
    if (Test-Path $BaselinePath) {
        try {
            $b = Get-Content $BaselinePath -Raw | ConvertFrom-Json
            $tunedOk = [bool]$b.applied.powerPlan
        } catch { }
    }

    function Mark($b) { if ($b) { return "$([char]0x2713)" } else { return 'x' } }
    function Col($b)  { if ($b) { return 'Green' } else { return 'Yellow' } }

    Write-Host '   สถานะเครื่อง' -ForegroundColor Gray
    Write-Host "     [$(Mark $nodeOk)] Node.js            " -NoNewline -ForegroundColor (Col $nodeOk)
    if ($nodeOk) { Write-Host $nodeVer -ForegroundColor Gray } else { Write-Host 'ไม่พบ — ต้องติดตั้งก่อน' -ForegroundColor Yellow }

    Write-Host "     [$(Mark $ollamaOk)] Ollama             " -NoNewline -ForegroundColor (Col $ollamaOk)
    if ($ollamaOk) { Write-Host 'ติดตั้งแล้ว' -ForegroundColor Gray } else { Write-Host 'ยังไม่ได้ติดตั้ง (เมนู 3)' -ForegroundColor Yellow }

    Write-Host "     [$(Mark $running)] Ollama ทำงานอยู่    " -NoNewline -ForegroundColor (Col $running)
    if ($running) { Write-Host 'พอร์ต 11434' -ForegroundColor Gray } else { Write-Host 'ยังไม่ทำงาน' -ForegroundColor Yellow }

    Write-Host "     [$(Mark $hasMain)] โมเดลหลัก          " -NoNewline -ForegroundColor (Col $hasMain)
    Write-Host $MainModel -ForegroundColor Gray

    Write-Host "     [$(Mark $hasAlt)] โมเดลสำรอง         " -NoNewline -ForegroundColor (Col $hasAlt)
    Write-Host $AltModel -ForegroundColor Gray

    Write-Host "     [$(Mark $tunedOk)] ปรับจูนเครื่องแล้ว   " -NoNewline -ForegroundColor (Col $tunedOk)
    if ($tunedOk) { Write-Host 'power plan + WSL cap' -ForegroundColor Gray } else { Write-Host 'ยังไม่ได้ปรับ (เมนู 2)' -ForegroundColor Yellow }

    Write-Host "     [$(Mark $adminOk)] สิทธิ์ Admin        " -NoNewline -ForegroundColor (Col $adminOk)
    if ($adminOk) { Write-Host 'มี' -ForegroundColor Gray } else { Write-Host 'ไม่มี (เมนู 2 จะขอเอง)' -ForegroundColor Gray }

    if (Test-Path $ResultPath) {
        Write-Host "     [$([char]0x2713)] มีผลวัดแล้ว        " -NoNewline -ForegroundColor Green
        Write-Host (Get-Item $ResultPath).LastWriteTime.ToString('dd/MM/yyyy HH:mm') -ForegroundColor Gray
    }
    Write-Host ''

    return [pscustomobject]@{
        NodeOk = $nodeOk; OllamaOk = $ollamaOk; Running = $running
        HasMain = $hasMain; HasAlt = $hasAlt; Tuned = $tunedOk; Admin = $adminOk
    }
}

function Wait-Key {
    if ($NoPause) { return }
    Write-Host ''
    Write-Host '   กด Enter เพื่อกลับไปที่เมนู...' -ForegroundColor DarkGray
    [void](Read-Host)
}

function Invoke-Elevated {
    param([string]$StepName)
    Write-Host '   กำลังขอสิทธิ์ Administrator — กด "Yes" ในหน้าต่างที่เด้งขึ้นมา' -ForegroundColor Yellow
    $psArgs = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSCommandPath`"", '-Step', $StepName)
    try {
        $p = Start-Process powershell -Verb RunAs -ArgumentList $psArgs -PassThru -Wait
        if ($p.ExitCode -ne 0) { Write-Host "   หน้าต่าง Admin จบด้วย exit code $($p.ExitCode)" -ForegroundColor Yellow }
    } catch {
        Write-Host '   ผู้ใช้ยกเลิก หรือขอสิทธิ์ไม่สำเร็จ' -ForegroundColor Red
    }
}

# ---------------------------------------------------------------------------
# ขั้นตอนต่างๆ
# ---------------------------------------------------------------------------
function Step-Inspect {
    Write-Title
    Write-Host '   [1] สำรวจเครื่อง — ไม่แก้ไขอะไรทั้งสิ้น' -ForegroundColor Cyan
    Write-Host ''
    & powershell -NoProfile -ExecutionPolicy Bypass -File $SetupScript
}

function Step-Tune {
    if (-not (Test-Admin)) {
        Write-Title
        Write-Host '   [2] ปรับจูนเครื่อง — ต้องใช้สิทธิ์ Administrator' -ForegroundColor Cyan
        Write-Host ''
        Write-Host '   จะเปลี่ยน 3 อย่าง (ย้อนกลับได้ทั้งหมดด้วยเมนู 8):' -ForegroundColor Gray
        Write-Host '     1. power plan -> High performance (เฉพาะตอนเสียบไฟ)' -ForegroundColor Gray
        Write-Host '     2. จำกัด RAM ของ WSL2 ไว้ที่ 1536 MB' -ForegroundColor Gray
        Write-Host '     3. ตั้งตัวแปรของ Ollama (KEEP_ALIVE / NUM_PARALLEL)' -ForegroundColor Gray
        Write-Host ''
        Invoke-Elevated -StepName 'tune'
        return
    }

    Write-Title
    Write-Host '   [2] ปรับจูนเครื่อง (มีสิทธิ์ Admin แล้ว)' -ForegroundColor Cyan
    Write-Host ''
    & powershell -NoProfile -ExecutionPolicy Bypass -File $SetupScript -Apply

    Write-Host ''
    Write-Host '   ต้องการ restart WSL ตอนนี้เลยไหม?' -ForegroundColor Yellow
    Write-Host '   (ค่า .wslconfig จะมีผลก็ต่อเมื่อ restart — แต่ Docker/Postgres จะดับชั่วคราว)' -ForegroundColor DarkGray
    Write-Host '   พิมพ์ y ถ้าตอนนี้ปิดร้านแล้ว / ไม่มีใครกำลังขายของ' -ForegroundColor DarkGray
    $ans = Read-Host '   restart WSL? (y/N)'
    if ($ans -eq 'y' -or $ans -eq 'Y') {
        Write-Host '   กำลัง wsl --shutdown ...' -ForegroundColor Yellow
        & wsl --shutdown
        Write-Host '   เรียบร้อย — อย่าลืมเปิด Docker Desktop ขึ้นมาใหม่' -ForegroundColor Green
    } else {
        Write-Host '   ข้ามไป — ค่าจะมีผลหลัง reboot ครั้งถัดไป' -ForegroundColor Gray
    }
}

function Step-InstallModels {
    Write-Title
    Write-Host '   [3] ติดตั้ง Ollama + โมเดล AI' -ForegroundColor Cyan
    Write-Host ''

    if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
        Write-Host '   ยังไม่พบ Ollama บนเครื่องนี้' -ForegroundColor Yellow
        Write-Host ''
        $hasWinget = [bool](Get-Command winget -ErrorAction SilentlyContinue)
        if ($hasWinget) {
            Write-Host '   ติดตั้งอัตโนมัติผ่าน winget ได้ (ประมาณ 700 MB)' -ForegroundColor Gray
            $ans = Read-Host '   ติดตั้งเลยไหม? (Y/n)'
            if ($ans -ne 'n' -and $ans -ne 'N') {
                & winget install --id Ollama.Ollama -e --accept-source-agreements --accept-package-agreements
                Write-Host ''
                Write-Host '   ติดตั้งเสร็จแล้ว *** ต้องปิดหน้าต่างนี้แล้วเปิด ai-setup.bat ใหม่ ***' -ForegroundColor Yellow
                Write-Host '   (เพื่อให้ Windows รู้จักคำสั่ง ollama)' -ForegroundColor DarkGray
                return
            }
        }
        Write-Host '   เปิดหน้าดาวน์โหลดให้ — ติดตั้งเสร็จแล้วเปิด ai-setup.bat ใหม่' -ForegroundColor Gray
        Start-Process 'https://ollama.com/download/windows'
        return
    }

    if (-not (Test-Port)) {
        Write-Host '   Ollama ยังไม่ทำงาน — กำลังสั่งให้เริ่ม...' -ForegroundColor Yellow
        try { Start-Process 'ollama' -ArgumentList 'serve' -WindowStyle Hidden } catch { }
        Start-Sleep -Seconds 4
    }

    $models = Get-InstalledModels
    foreach ($m in @($MainModel, $AltModel)) {
        if ($models -contains $m) {
            Write-Host "   มีอยู่แล้ว: $m" -ForegroundColor Green
            continue
        }
        Write-Host ''
        Write-Host "   กำลังโหลด $m ..." -ForegroundColor Cyan
        Write-Host '   (ครั้งแรกใช้เวลานานตามความเร็วเน็ต ปล่อยไว้ได้เลย)' -ForegroundColor DarkGray
        & ollama pull $m
    }

    Write-Host ''
    Write-Host '   ตั้ง priority ของ Ollama ให้ต่ำ เพื่อไม่ให้แย่ง CPU จากหน้าขาย...' -ForegroundColor Gray
    try {
        Get-Process ollama* -ErrorAction SilentlyContinue | ForEach-Object { $_.PriorityClass = 'BelowNormal' }
        Write-Host '   เรียบร้อย' -ForegroundColor Green
    } catch {
        Write-Host '   ตั้งไม่สำเร็จ (ไม่เป็นไร ข้ามได้)' -ForegroundColor DarkGray
    }
}

function Step-Bench {
    param([switch]$Quick, [string]$Model = '')

    Write-Title
    if ($Quick) {
        Write-Host '   [4] วัดผลแบบเร็ว — ประมาณ 8 นาที' -ForegroundColor Cyan
    } else {
        Write-Host '   [5] วัดผลเต็มรูปแบบ — ประมาณ 20-40 นาที' -ForegroundColor Cyan
    }
    Write-Host ''

    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host '   ไม่พบ Node.js — ต้องติดตั้งก่อน (https://nodejs.org)' -ForegroundColor Red
        return
    }
    if (-not (Test-Port)) {
        Write-Host '   Ollama ไม่ทำงาน — ทำเมนู 3 ก่อน' -ForegroundColor Red
        return
    }

    Write-Host '   ระหว่างวัด อย่าเพิ่งใช้เครื่องทำอย่างอื่น เพราะจะทำให้ตัวเลขเพี้ยน' -ForegroundColor Yellow
    Write-Host '   (แต่เปิดแอป POS ทิ้งไว้ได้ — การทดสอบ T6 ต้องใช้)' -ForegroundColor DarkGray
    Write-Host ''

    $benchArgs = @($BenchScript)
    if ($Quick) { $benchArgs += '--quick' }
    if ($Model) { $benchArgs += @('--model', $Model) }

    $started = Get-Date
    & node @benchArgs
    $mins = [math]::Round(((Get-Date) - $started).TotalMinutes, 1)
    Write-Host ''
    Write-Host "   ใช้เวลาทั้งหมด $mins นาที" -ForegroundColor Gray
}

function Step-OpenResults {
    Write-Title
    Write-Host '   [6] เปิดไฟล์ผลลัพธ์' -ForegroundColor Cyan
    Write-Host ''
    $any = $false
    foreach ($f in @($ResultPath, $BaselinePath, $ReportPath)) {
        if (Test-Path $f) {
            Write-Host "   เปิด: $f" -ForegroundColor Gray
            Invoke-Item $f
            $any = $true
        }
    }
    if (-not $any) {
        Write-Host '   ยังไม่มีไฟล์ผลลัพธ์ — ทำเมนู 4 หรือ 5 ก่อน' -ForegroundColor Yellow
        return
    }
    Write-Host ''
    Write-Host '   ส่งไฟล์ ai-bench-result.json กลับไปให้ผู้พัฒนาอ่าน' -ForegroundColor Green
    Write-Host "   และกรอกรายงานที่ $ReportPath" -ForegroundColor Gray
}

function Step-EditQuestions {
    Write-Title
    Write-Host '   [7] แก้ไขชุดคำถามทดสอบ' -ForegroundColor Cyan
    Write-Host ''
    Write-Host '   ไฟล์นี้คือคำถามที่ใช้วัดความแม่นยำ' -ForegroundColor Gray
    Write-Host '   แก้ข้อความในช่อง "q" ให้เป็นคำถามที่คุณกับพนักงานจะพิมพ์จริงๆ' -ForegroundColor Gray
    Write-Host '   พิมพ์ผิด/พิมพ์สั้นห้วน ใส่ได้เลย เพราะนั่นคือของจริง' -ForegroundColor Gray
    Write-Host ''
    Write-Host '   *** ห้ามลบเครื่องหมาย , หรือ " ไม่งั้นไฟล์จะเสีย ***' -ForegroundColor Yellow
    Write-Host ''
    if (-not (Test-Path $QuestionsPath)) {
        Write-Host "   ไม่พบไฟล์ $QuestionsPath" -ForegroundColor Red
        return
    }
    Start-Process notepad.exe $QuestionsPath
    Write-Host '   เปิด Notepad ให้แล้ว — บันทึกแล้วปิดหน้าต่างนั้นได้เลย' -ForegroundColor Green
    Write-Host ''
    Write-Host '   กำลังรอตรวจไฟล์...' -ForegroundColor DarkGray
    Write-Host '   กด Enter หลังบันทึกเสร็จ เพื่อให้ตรวจว่าไฟล์ยังใช้ได้' -ForegroundColor DarkGray
    [void](Read-Host)
    try {
        # ReadAllText ตรวจ BOM ให้เอง — Notepad อาจบันทึกเป็น UTF-8 with BOM
        $j = [System.IO.File]::ReadAllText($QuestionsPath) | ConvertFrom-Json
        Write-Host "   ไฟล์ใช้ได้ — มีคำถาม $($j.questions.Count) ข้อ" -ForegroundColor Green
    } catch {
        Write-Host '   ไฟล์เสีย! JSON ผิดรูปแบบ:' -ForegroundColor Red
        Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
        Write-Host '   แก้ให้ถูกก่อน ไม่งั้นเมนู 4/5 จะรันไม่ได้' -ForegroundColor Yellow
    }
}

function Step-Revert {
    Write-Title
    Write-Host '   [8] คืนค่าเครื่องกลับเป็นเหมือนเดิม' -ForegroundColor Cyan
    Write-Host ''
    if (-not (Test-Path $BaselinePath)) {
        Write-Host '   ไม่พบไฟล์ baseline — ยังไม่เคยปรับอะไร ไม่ต้องคืนค่า' -ForegroundColor Yellow
        return
    }
    Write-Host '   จะคืนค่า: power plan เดิม, .wslconfig เดิม, ลบตัวแปร OLLAMA_*' -ForegroundColor Gray
    $ans = Read-Host '   ยืนยัน? (y/N)'
    if ($ans -ne 'y' -and $ans -ne 'Y') {
        Write-Host '   ยกเลิก' -ForegroundColor Gray
        return
    }
    if (-not (Test-Admin)) {
        Invoke-Elevated -StepName 'revert'
        return
    }
    & powershell -NoProfile -ExecutionPolicy Bypass -File $SetupScript -Revert
}

function Step-RunAll {
    Write-Title
    Write-Host '   [A] ทำทุกขั้นตอนอัตโนมัติ' -ForegroundColor Cyan
    Write-Host ''
    Write-Host '   ลำดับ: สำรวจ -> ปรับจูน -> ติดตั้งโมเดล -> วัดผลเต็ม' -ForegroundColor Gray
    Write-Host '   ใช้เวลารวมประมาณ 1 ชั่วโมง (ขึ้นกับความเร็วเน็ตตอนโหลดโมเดล)' -ForegroundColor Gray
    Write-Host '   ระหว่างทางจะมีหน้าต่างขอสิทธิ์ Admin เด้งขึ้นมา 1 ครั้ง' -ForegroundColor Yellow
    Write-Host ''
    $ans = Read-Host '   เริ่มเลยไหม? (y/N)'
    if ($ans -ne 'y' -and $ans -ne 'Y') { return }

    Step-Inspect
    Write-Host ''
    Write-Host '   --- ขั้นที่ 1 เสร็จ ไปต่อขั้นที่ 2 ---' -ForegroundColor Cyan
    Start-Sleep -Seconds 2

    Step-Tune
    Write-Host ''
    Write-Host '   --- ขั้นที่ 2 เสร็จ ไปต่อขั้นที่ 3 ---' -ForegroundColor Cyan
    Start-Sleep -Seconds 2

    Step-InstallModels
    if (-not (Test-Port)) {
        Write-Host ''
        Write-Host '   Ollama ยังไม่พร้อม — หยุดตรงนี้ก่อน' -ForegroundColor Red
        Write-Host '   ทำเมนู 3 ให้เสร็จแล้วค่อยรันเมนู 5' -ForegroundColor Yellow
        return
    }
    Write-Host ''
    Write-Host '   --- ขั้นที่ 3 เสร็จ เริ่มวัดผล ---' -ForegroundColor Cyan
    Start-Sleep -Seconds 2

    Step-Bench
    Step-OpenResults
}

# ---------------------------------------------------------------------------
# เรียกตรงจากการยกระดับสิทธิ์ (ไม่ต้องแสดงเมนู)
# ---------------------------------------------------------------------------
if ($Step) {
    switch ($Step.ToLower()) {
        'tune'   { Step-Tune;   Write-Host ''; Write-Host '   เสร็จแล้ว — ปิดหน้าต่างนี้ได้' -ForegroundColor Green; [void](Read-Host); exit 0 }
        'revert' { Step-Revert; Write-Host ''; Write-Host '   เสร็จแล้ว — ปิดหน้าต่างนี้ได้' -ForegroundColor Green; [void](Read-Host); exit 0 }
        default  { Write-Host "ไม่รู้จักขั้นตอน: $Step" -ForegroundColor Red; exit 1 }
    }
}

# ---------------------------------------------------------------------------
# ลูปเมนูหลัก
# ---------------------------------------------------------------------------
while ($true) {
    Write-Title
    $st = Write-Status

    Write-Host '   เมนู' -ForegroundColor Gray
    Write-Host '     1  สำรวจเครื่อง (ปลอดภัย ไม่แก้อะไร)'
    Write-Host '     2  ปรับจูนเครื่อง (power plan / WSL / Ollama)'
    Write-Host '     3  ติดตั้ง Ollama + โมเดล AI'
    Write-Host '     4  วัดผลแบบเร็ว        (~8 นาที)'
    Write-Host '     5  วัดผลเต็มรูปแบบ     (~20-40 นาที)'
    Write-Host '     6  เปิดไฟล์ผลลัพธ์'
    Write-Host '     7  แก้ไขชุดคำถามทดสอบ'
    Write-Host '     8  คืนค่าเครื่องเดิม'
    Write-Host ''
    Write-Host '     A  ทำทุกขั้นตอนอัตโนมัติ' -ForegroundColor Green
    Write-Host '     0  ออก' -ForegroundColor DarkGray
    Write-Host ''

    # แนะนำขั้นถัดไปให้อัตโนมัติ
    $suggest = ''
    if (-not $st.NodeOk)        { $suggest = 'ติดตั้ง Node.js ก่อน (https://nodejs.org)' }
    elseif (-not $st.OllamaOk)  { $suggest = 'เริ่มที่เมนู 3 (ติดตั้ง Ollama)' }
    elseif (-not $st.Tuned)     { $suggest = 'เริ่มที่เมนู 2 (ปรับจูนเครื่อง) เพื่อให้วัดได้ตัวเลขจริง' }
    elseif (-not $st.HasMain)   { $suggest = 'เมนู 3 เพื่อโหลดโมเดล' }
    else                        { $suggest = 'พร้อมวัดแล้ว — เมนู 4 หรือ 5' }
    Write-Host "   แนะนำ: $suggest" -ForegroundColor Cyan
    Write-Host ''

    $choice = Read-Host '   เลือก'
    switch ($choice.Trim().ToUpper()) {
        '1' { Step-Inspect;                Wait-Key }
        '2' { Step-Tune;                   Wait-Key }
        '3' { Step-InstallModels;          Wait-Key }
        '4' { Step-Bench -Quick;           Wait-Key }
        '5' { Step-Bench;                  Wait-Key }
        '6' { Step-OpenResults;            Wait-Key }
        '7' { Step-EditQuestions;          Wait-Key }
        '8' { Step-Revert;                 Wait-Key }
        'A' { Step-RunAll;                 Wait-Key }
        '0' { Write-Host ''; Write-Host '   ออกแล้ว' -ForegroundColor Gray; exit 0 }
        ''  { }
        default { Write-Host '   ไม่มีตัวเลือกนี้' -ForegroundColor Red; Start-Sleep -Seconds 1 }
    }
}
