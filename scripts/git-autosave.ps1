<#
.SYNOPSIS
    Autosave: snapshot โปรเจกต์ขึ้น GitHub อัตโนมัติทุก 30 นาที

.DESCRIPTION
    ออกแบบให้ "ไม่รบกวนงานที่กำลังทำอยู่" เป็นข้อกำหนดข้อแรก:

      • ไม่แตะ staging area (index) ของคุณ  — ใช้ index ชั่วคราวแยกไฟล์
      • ไม่แตะ working tree                 — ไม่มี checkout / stash / reset
      • ไม่แตะ branch ที่คุณอยู่             — เขียน ref ของ autosave ตรง ๆ
      • ไม่ commit ถ้าไม่มีอะไรเปลี่ยน       — เทียบ tree hash แบบ exact

    วิธีการ: git read-tree → git add (ลง temp index) → git write-tree
             → git commit-tree → git update-ref  → git push
    ทั้งหมดเป็น plumbing command จึงไม่ยุ่งกับ state ที่ผู้ใช้เห็น

.NOTES
    รันโดย Windows Task Scheduler — ดู scripts\install-autosave-task.ps1
    log: %LOCALAPPDATA%\SmileStoreAutosave\autosave.log
#>

[CmdletBinding()]
param(
    # โฟลเดอร์ repo (ปกติไม่ต้องส่ง — เดาจากตำแหน่งสคริปต์)
    [string]$RepoPath,

    # ชื่อ branch ปลายทาง (ปกติไม่ต้องส่ง — autosave/<ชื่อเครื่อง>)
    [string]$Branch,

    # ทดสอบแบบไม่ push จริง
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# ──────────────────────────────────────────────────────────────
# ค่าตั้งต้น
# ──────────────────────────────────────────────────────────────
if (-not $RepoPath) { $RepoPath = Split-Path -Parent $PSScriptRoot }
if (-not $Branch)   { $Branch   = "autosave/$($env:COMPUTERNAME)".ToLower() }

$LogDir     = Join-Path $env:LOCALAPPDATA 'SmileStoreAutosave'
$LogFile    = Join-Path $LogDir 'autosave.log'
$LockFile   = Join-Path $LogDir 'autosave.lock'
$MaxLogSize = 5MB
$MaxBlobSize = 90MB          # GitHub ปฏิเสธไฟล์ > 100MB
$PushRetries = 3

# ไฟล์ที่ห้ามหลุดขึ้น GitHub เด็ดขาด (ด่านที่ 2 ถัดจาก .gitignore)
$ForbiddenPattern = '(^|/)\.env($|\.(?!example))|(^|/)pg-data|(^|/)backups/|^data/|^uploads/|\.(dump|sqlite3?|mdb|pfx|pem|key)$|auto_backup_.*\.json$'

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

# ──────────────────────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────────────────────
function Write-Log {
    param([string]$Message, [ValidateSet('INFO', 'WARN', 'ERROR', 'OK')][string]$Level = 'INFO')
    $line = "{0} [{1,-5}] {2}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Message
    try {
        if ((Test-Path $LogFile) -and (Get-Item $LogFile).Length -gt $MaxLogSize) {
            Move-Item $LogFile "$LogFile.1" -Force   # rotate เก็บรอบเดียวพอ
        }
        Add-Content -Path $LogFile -Value $line -Encoding utf8
    } catch { }
    Write-Output $line
}

# git wrapper: รวม stderr, เช็ค exit code เอง (ไม่ให้ PowerShell ตีความ stderr เป็น error)
# ⚠️ ตั้งใจไม่ใส่ param() — ให้ทุก argument ตกลง $args ดิบ ๆ
#    ถ้ามี param([string[]]$Arguments) PowerShell จะมอง `-A` เป็นตัวย่อของ `-Arguments` แล้วพัง
function Invoke-Git {
    # git เขียน warning ลง stderr เป็นเรื่องปกติ (เช่นเรื่อง CRLF) — ห้ามให้ ErrorActionPreference='Stop'
    # ตีความว่าเป็น error ที่ต้องหยุดทำงาน จึงต้องปลดชั่วคราวแล้วเช็ค exit code เอง
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $raw  = & git -C $RepoPath @args 2>&1
        $code = $LASTEXITCODE
        $text = (@($raw) | ForEach-Object {
            if ($_ -is [System.Management.Automation.ErrorRecord]) { $_.Exception.Message } else { [string]$_ }
        }) -join "`n"
    }
    finally { $ErrorActionPreference = $prevEap }

    return [PSCustomObject]@{
        ExitCode = $code
        Output   = $text.Trim()
        Ok       = ($code -eq 0)
    }
}

# ──────────────────────────────────────────────────────────────
# Lock: กันรันซ้อนกัน (task รอบก่อนยังไม่จบ)
# ──────────────────────────────────────────────────────────────
if (Test-Path $LockFile) {
    $age = (Get-Date) - (Get-Item $LockFile).LastWriteTime
    if ($age.TotalMinutes -lt 25) {
        Write-Log "มี autosave รอบก่อนทำงานค้างอยู่ ($([int]$age.TotalMinutes) นาที) — ข้ามรอบนี้" 'WARN'
        exit 0
    }
    Write-Log "พบ lock ค้างเกิน 25 นาที — ถือว่าเป็นของเก่า แล้วทำงานต่อ" 'WARN'
}
Set-Content -Path $LockFile -Value $PID -Encoding utf8

try {
    # ──────────────────────────────────────────────────────────
    # ตรวจสภาพ repo
    # ──────────────────────────────────────────────────────────
    if (-not (Test-Path (Join-Path $RepoPath '.git'))) {
        Write-Log "ไม่พบ .git ที่ $RepoPath" 'ERROR'; exit 1
    }

    $gitDir = (Invoke-Git rev-parse --absolute-git-dir).Output

    # ระหว่าง merge/rebase/bisect — git state ไม่นิ่ง ข้ามไปก่อน ปลอดภัยกว่า
    foreach ($marker in @('MERGE_HEAD', 'REBASE_HEAD', 'rebase-merge', 'rebase-apply', 'BISECT_LOG', 'CHERRY_PICK_HEAD')) {
        if (Test-Path (Join-Path $gitDir $marker)) {
            Write-Log "repo อยู่ระหว่าง $marker — ข้ามรอบนี้เพื่อความปลอดภัย" 'WARN'; exit 0
        }
    }

    # ──────────────────────────────────────────────────────────
    # สร้าง snapshot ใน index ชั่วคราว (ไม่แตะ index จริงของผู้ใช้)
    # ──────────────────────────────────────────────────────────
    $tempIndex = Join-Path $gitDir 'autosave-index'
    if (Test-Path $tempIndex) { Remove-Item $tempIndex -Force }
    $env:GIT_INDEX_FILE = $tempIndex

    try {
        $head       = (Invoke-Git rev-parse -q --verify HEAD)
        $branchRef  = "refs/heads/$Branch"
        $prev       = (Invoke-Git rev-parse -q --verify $branchRef)

        # เริ่ม index จาก commit ก่อนหน้า (autosave เดิม > HEAD > ว่าง)
        $seed = if ($prev.Ok) { $prev.Output } elseif ($head.Ok) { $head.Output } else { $null }
        if ($seed) {
            $r = Invoke-Git read-tree $seed
            if (-not $r.Ok) { Write-Log "read-tree ล้มเหลว: $($r.Output)" 'ERROR'; exit 1 }
        }

        # stage ทุกอย่างที่ .gitignore ยอม (ลง temp index เท่านั้น)
        $r = Invoke-Git add -A
        if (-not $r.Ok) { Write-Log "git add ล้มเหลว: $($r.Output)" 'ERROR'; exit 1 }

        # ─── ด่านความปลอดภัย 1: ไฟล์ต้องห้าม ───
        $staged = @((Invoke-Git ls-files --cached).Output -split "`r?`n" | Where-Object { $_ })
        $leaked = @($staged | Where-Object { $_ -match $ForbiddenPattern })
        if ($leaked.Count -gt 0) {
            Write-Log "🚨 ยกเลิก autosave — พบไฟล์ต้องห้าม $($leaked.Count) ไฟล์: $($leaked -join ', ')" 'ERROR'
            Write-Log "ตรวจ .gitignore ด่วน ข้อมูลลับ/ข้อมูลลูกค้าอาจกำลังจะหลุด" 'ERROR'
            exit 1
        }

        # ─── ด่านความปลอดภัย 2: ไฟล์ใหญ่เกินที่ GitHub รับ ───
        $huge = @(
            (Invoke-Git ls-files --cached -s).Output -split "`r?`n" |
                Where-Object { $_ -match '^\d+ ([0-9a-f]{40}) \d+\t(.+)$' } |
                ForEach-Object {
                    if ($_ -match '^\d+ ([0-9a-f]{40}) \d+\t(.+)$') {
                        $size = (Invoke-Git cat-file -s $matches[1]).Output
                        if ([int64]$size -gt $MaxBlobSize) { "$($matches[2]) ($([math]::Round([int64]$size/1MB,1)) MB)" }
                    }
                }
        )
        if ($huge.Count -gt 0) {
            Write-Log "🚨 ยกเลิก autosave — ไฟล์ใหญ่เกิน 90MB: $($huge -join ', ')" 'ERROR'; exit 1
        }

        # ──────────────────────────────────────────────────────
        # เทียบ tree — ไม่มีอะไรเปลี่ยน ก็ไม่ต้อง commit
        # ──────────────────────────────────────────────────────
        $treeRes = Invoke-Git write-tree
        if (-not $treeRes.Ok) { Write-Log "write-tree ล้มเหลว: $($treeRes.Output)" 'ERROR'; exit 1 }
        $tree = $treeRes.Output

        # push แยกเป็นฟังก์ชัน เพราะมีหลายเส้นทางที่ต้องใช้
        function Invoke-Push {
            for ($i = 1; $i -le $PushRetries; $i++) {
                $p = Invoke-Git push --quiet origin "$branchRef`:$branchRef"
                if ($p.Ok) { Write-Log "push ขึ้น origin/$Branch สำเร็จ" 'OK'; return $true }
                Write-Log "push ครั้งที่ $i ล้มเหลว: $($p.Output)" 'WARN'
                if ($i -lt $PushRetries) { Start-Sleep -Seconds (5 * $i) }
            }
            Write-Log "push ไม่สำเร็จครบ $PushRetries ครั้ง — commit ถูกเก็บไว้ในเครื่อง รอบหน้าจะ push ให้เอง" 'WARN'
            return $false
        }

        if ($prev.Ok) {
            $prevTree = (Invoke-Git rev-parse "$($prev.Output)^{tree}").Output
            if ($prevTree -eq $tree) {
                Write-Log "ไม่มีไฟล์เปลี่ยนแปลง — ข้ามการสร้าง commit" 'INFO'
                if (-not $DryRun) { Invoke-Push | Out-Null }
                exit 0
            }
        }
        elseif ($head.Ok) {
            # รอบแรก: ถ้าไฟล์ยังตรงกับ HEAD เป๊ะ ไม่ต้อง commit ซ้ำ แค่ตั้ง branch ให้ชี้ HEAD
            $headTree = (Invoke-Git rev-parse "$($head.Output)^{tree}").Output
            if ($headTree -eq $tree) {
                if ($DryRun) { Write-Log "[DryRun] จะตั้ง $Branch ให้ชี้ HEAD (ไฟล์ตรงกับ HEAD อยู่แล้ว)" 'INFO'; exit 0 }
                $r = Invoke-Git update-ref $branchRef $head.Output
                if (-not $r.Ok) { Write-Log "update-ref ล้มเหลว: $($r.Output)" 'ERROR'; exit 1 }
                Write-Log "สร้าง branch $Branch ชี้ที่ HEAD (ยังไม่มีไฟล์เปลี่ยน)" 'OK'
                Invoke-Push | Out-Null
                exit 0
            }
        }

        # ──────────────────────────────────────────────────────
        # สร้าง commit message ที่อ่านรู้เรื่อง
        # ──────────────────────────────────────────────────────
        $stamp = Get-Date -Format 'yyyy-MM-dd HH:mm'

        # เทียบกับ autosave ครั้งก่อน ถ้ายังไม่มีก็เทียบกับ HEAD (จะได้ไม่รายงานว่าเปลี่ยนทั้ง repo)
        $baseTree = if ($prev.Ok) { "$($prev.Output)^{tree}" } elseif ($head.Ok) { "$($head.Output)^{tree}" } else { $null }

        if ($baseTree) {
            $stat  = (Invoke-Git diff --shortstat $baseTree $tree).Output
            $names = @((Invoke-Git diff --name-only $baseTree $tree).Output -split "`r?`n" | Where-Object { $_ })
        } else {
            $stat  = 'snapshot แรกของ repo'
            $names = $staged
        }
        if (-not $stat) { $stat = 'ไม่มีสถิติ' }

        $top = ($names | Select-Object -First 3) -join ', '
        if ($names.Count -gt 3) { $top += " และอีก $($names.Count - 3) ไฟล์" }

        $message = @"
chore(autosave): $stamp — $($names.Count) ไฟล์

$($stat.Trim())
$top

เครื่อง: $env:COMPUTERNAME | ผู้ใช้: $env:USERNAME
commit นี้สร้างอัตโนมัติโดย scripts/git-autosave.ps1 (ไม่ใช่ commit ที่ตั้งใจทำ)
"@

        if ($DryRun) {
            Write-Log "[DryRun] จะ commit $($names.Count) ไฟล์ — $($stat.Trim())" 'INFO'
            exit 0
        }

        # ──────────────────────────────────────────────────────
        # commit + ย้าย ref (ไม่แตะ HEAD ของผู้ใช้)
        # ──────────────────────────────────────────────────────
        $parentArgs = if ($prev.Ok) { @('-p', $prev.Output) } elseif ($head.Ok) { @('-p', $head.Output) } else { @() }

        # ⚠️ ห้าม pipe ข้อความเข้า git (`$message | git commit-tree`)
        #    PowerShell 5.1 แปลง encoding ตอนส่งเข้า native command — ภาษาไทยกลายเป็น "?"
        #    และมี BOM ติดหัวข้อความ  จึงเขียนลงไฟล์ UTF-8 (ไม่มี BOM) แล้วให้ git อ่านด้วย -F
        $msgFile = Join-Path $gitDir 'autosave-msg'
        [System.IO.File]::WriteAllText($msgFile, $message, (New-Object System.Text.UTF8Encoding $false))

        $prevEap = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        try {
            $commitRaw = (& git -C $RepoPath commit-tree $tree @parentArgs -F $msgFile 2>&1)
            $commitCode = $LASTEXITCODE
        }
        finally {
            $ErrorActionPreference = $prevEap
            Remove-Item $msgFile -Force -ErrorAction SilentlyContinue
        }

        $commit = ((@($commitRaw) | ForEach-Object {
            if ($_ -is [System.Management.Automation.ErrorRecord]) { $_.Exception.Message } else { [string]$_ }
        }) -join "`n").Trim()

        if ($commitCode -ne 0 -or $commit -notmatch '^[0-9a-f]{40}$') {
            Write-Log "commit-tree ล้มเหลว: $commit" 'ERROR'; exit 1
        }

        $r = Invoke-Git update-ref $branchRef $commit
        if (-not $r.Ok) { Write-Log "update-ref ล้มเหลว: $($r.Output)" 'ERROR'; exit 1 }

        Write-Log "commit $($commit.Substring(0,8)) → $Branch : $($names.Count) ไฟล์ ($($stat.Trim()))" 'OK'

        # push พร้อม retry (เน็ตหลุดถือว่าไม่ร้ายแรง — commit อยู่ในเครื่องแล้ว)
        Invoke-Push | Out-Null
    }
    finally {
        Remove-Item Env:\GIT_INDEX_FILE -ErrorAction SilentlyContinue
        if (Test-Path $tempIndex) { Remove-Item $tempIndex -Force -ErrorAction SilentlyContinue }
    }
}
catch {
    Write-Log "ข้อผิดพลาดที่ไม่ได้ดักไว้: $($_.Exception.Message)" 'ERROR'
    exit 1
}
finally {
    Remove-Item $LockFile -Force -ErrorAction SilentlyContinue
}
