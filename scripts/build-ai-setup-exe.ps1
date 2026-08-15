<#
.SYNOPSIS
    สร้าง SmilePharmacy-AI-Setup.exe — ไฟล์เดียวจบสำหรับเอาไปรันบนเครื่อง POS

.DESCRIPTION
    ฝังสคริปต์ทั้งหมดไว้ในตัว .exe (gzip + base64) ตอนรันจะคลายไฟล์ออกมาไว้
    ข้างๆ ตัวเอง แล้วเปิดเมนู PowerShell ให้

    - ไฟล์ในโฟลเดอร์ scripts\ ถูกเขียนทับทุกครั้งที่รัน (ได้เวอร์ชันล่าสุดเสมอ)
    - ไฟล์ในโฟลเดอร์ scratch\ เขียนเฉพาะตอนยังไม่มี (ไม่ทับคำถามที่ผู้ใช้แก้ไว้)
    - ถ้าเขียนข้างๆ ตัวเองไม่ได้ (เช่นวางไว้ใน Program Files) จะย้ายไป
      %LOCALAPPDATA%\SmilePharmacyAI ให้อัตโนมัติ

    คอมไพล์ด้วย csc ที่มากับ .NET Framework — ไม่ต้องลง SDK อะไรเพิ่ม
    ไม่ต้องต่อเน็ต

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts\build-ai-setup-exe.ps1
#>

[CmdletBinding()]
param(
    [string]$OutputPath = ''
)

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
if (-not $OutputPath) { $OutputPath = Join-Path $ProjectRoot 'SmilePharmacy-AI-Setup.exe' }

# path (relative to exe)  ->  overwrite ทุกครั้งหรือไม่
$Payloads = @(
    @{ Path = 'scripts\ai-phase0-menu.ps1';   Always = $true },
    @{ Path = 'scripts\setup-ai-machine.ps1'; Always = $true },
    @{ Path = 'scripts\bench-ai.mjs';         Always = $true },
    @{ Path = 'scratch\ai-bench-questions.json'; Always = $false },
    @{ Path = 'scratch\ai-bench-report.md';      Always = $false }
)

function Write-Head($t) {
    Write-Host ''
    Write-Host ('=' * 68) -ForegroundColor DarkGray
    Write-Host "  $t" -ForegroundColor Cyan
    Write-Host ('=' * 68) -ForegroundColor DarkGray
}
function Write-Row($l, $v, $c = 'White') {
    Write-Host ("  {0,-30} " -f $l) -NoNewline -ForegroundColor Gray
    Write-Host $v -ForegroundColor $c
}

function ConvertTo-GzipBase64 {
    param([byte[]]$Bytes)
    $ms = New-Object System.IO.MemoryStream
    $gz = New-Object System.IO.Compression.GZipStream($ms, [System.IO.Compression.CompressionMode]::Compress, $true)
    $gz.Write($Bytes, 0, $Bytes.Length)
    $gz.Close()
    $out = [Convert]::ToBase64String($ms.ToArray())
    $ms.Close()
    return $out
}

Write-Head 'สร้าง SmilePharmacy-AI-Setup.exe'

# --- อ่านและบีบอัดไฟล์ทั้งหมด -------------------------------------------------
$entries = @()
$rawTotal = 0
foreach ($p in $Payloads) {
    $full = Join-Path $ProjectRoot $p.Path
    if (-not (Test-Path $full)) { throw "ไม่พบไฟล์ที่ต้องฝัง: $full" }
    $bytes = [System.IO.File]::ReadAllBytes($full)
    $rawTotal += $bytes.Length
    $b64 = ConvertTo-GzipBase64 -Bytes $bytes
    $entries += [pscustomobject]@{ Path = $p.Path; Always = $p.Always; B64 = $b64; RawKB = [math]::Round($bytes.Length / 1KB, 1) }
    Write-Row "ฝัง $($p.Path)" "$([math]::Round($bytes.Length/1KB,1)) KB -> $([math]::Round($b64.Length/1KB,1)) KB (base64)"
}

# --- สร้างซอร์ส C# (ใช้ไวยากรณ์ C# 5 เท่านั้น เพราะ CodeDom ใช้คอมไพเลอร์เก่า) ---
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine(@'
using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Text;

public static class AiSetupLauncher
{
    class Item
    {
        public string Path;
        public bool Always;
        public string Data;
        public Item(string path, bool always, string data) { Path = path; Always = always; Data = data; }
    }

    static byte[] Unpack(string b64)
    {
        byte[] raw = Convert.FromBase64String(b64);
        using (MemoryStream src = new MemoryStream(raw))
        using (GZipStream gz = new GZipStream(src, CompressionMode.Decompress))
        using (MemoryStream dst = new MemoryStream())
        {
            byte[] buf = new byte[16384];
            int n;
            while ((n = gz.Read(buf, 0, buf.Length)) > 0) { dst.Write(buf, 0, n); }
            return dst.ToArray();
        }
    }

    static bool CanWrite(string dir)
    {
        try
        {
            Directory.CreateDirectory(dir);
            string probe = Path.Combine(dir, ".writetest.tmp");
            File.WriteAllText(probe, "x");
            File.Delete(probe);
            return true;
        }
        catch { return false; }
    }

    public static int Main(string[] args)
    {
        try { Console.OutputEncoding = Encoding.UTF8; }
        catch { }

        string exeDir = AppDomain.CurrentDomain.BaseDirectory;
        string baseDir = exeDir;

        if (!CanWrite(exeDir))
        {
            baseDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "SmilePharmacyAI");
            Console.WriteLine("  เขียนไฟล์ข้างๆ ตัวโปรแกรมไม่ได้ ย้ายไปทำงานที่:");
            Console.WriteLine("  " + baseDir);
            Console.WriteLine();
        }

        try
        {
            foreach (Item it in Files)
            {
                string full = Path.Combine(baseDir, it.Path);
                string dir = Path.GetDirectoryName(full);
                if (!Directory.Exists(dir)) { Directory.CreateDirectory(dir); }
                if (it.Always || !File.Exists(full))
                {
                    File.WriteAllBytes(full, Unpack(it.Data));
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("  คลายไฟล์ไม่สำเร็จ: " + ex.Message);
            Console.WriteLine("  กด Enter เพื่อปิด");
            Console.ReadLine();
            return 1;
        }

        string menu = Path.Combine(baseDir, "scripts\\ai-phase0-menu.ps1");
        if (!File.Exists(menu))
        {
            Console.WriteLine("  ไม่พบ " + menu);
            Console.ReadLine();
            return 1;
        }

        ProcessStartInfo psi = new ProcessStartInfo("powershell.exe",
            "-NoProfile -ExecutionPolicy Bypass -File \"" + menu + "\"");
        psi.UseShellExecute = false;
        psi.WorkingDirectory = baseDir;

        try
        {
            Process p = Process.Start(psi);
            p.WaitForExit();
            return p.ExitCode;
        }
        catch (Exception ex)
        {
            Console.WriteLine("  เปิด PowerShell ไม่ได้: " + ex.Message);
            Console.WriteLine("  กด Enter เพื่อปิด");
            Console.ReadLine();
            return 1;
        }
    }

'@)

[void]$sb.AppendLine('    static Item[] Files = new Item[] {')
for ($i = 0; $i -lt $entries.Count; $i++) {
    $e = $entries[$i]
    $comma = if ($i -lt $entries.Count - 1) { ',' } else { '' }
    $csPath = $e.Path.Replace('\', '\\')
    $always = if ($e.Always) { 'true' } else { 'false' }
    [void]$sb.AppendLine("        new Item(`"$csPath`", $always, `"$($e.B64)`")$comma")
}
[void]$sb.AppendLine('    };')
[void]$sb.AppendLine('}')

$source = $sb.ToString()
$srcPath = Join-Path $env:TEMP 'AiSetupLauncher.cs'
[System.IO.File]::WriteAllText($srcPath, $source, (New-Object System.Text.UTF8Encoding($true)))
Write-Row 'ซอร์ส C# ที่สร้าง' "$([math]::Round($source.Length/1KB,1)) KB  ($srcPath)"

# --- คอมไพล์ ------------------------------------------------------------------
Write-Head 'คอมไพล์'

if (Test-Path $OutputPath) { Remove-Item $OutputPath -Force }

$csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path $csc)) { $csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe' }
if (-not (Test-Path $csc)) { throw 'ไม่พบ csc.exe ของ .NET Framework 4 — เครื่องนี้คอมไพล์ .exe ไม่ได้' }
Write-Row 'คอมไพเลอร์' $csc

$cscArgs = @(
    '/nologo'
    '/target:exe'
    '/platform:anycpu'
    '/optimize+'
    "/out:`"$OutputPath`""
    "`"$srcPath`""
)
$out = & $csc @cscArgs 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host ''
    Write-Host '  คอมไพล์ไม่ผ่าน:' -ForegroundColor Red
    $out | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
    throw 'build failed'
}

Remove-Item $srcPath -Force -ErrorAction SilentlyContinue

$info = Get-Item $OutputPath
Write-Head 'เสร็จแล้ว'
Write-Row 'ไฟล์'          $info.FullName Green
Write-Row 'ขนาด'          "$([math]::Round($info.Length/1KB,1)) KB  (ฝังสคริปต์ $([math]::Round($rawTotal/1KB,1)) KB ไว้ข้างใน)"
Write-Row 'จำนวนไฟล์ที่ฝัง' $entries.Count
Write-Host ''
Write-Host '  วิธีใช้: ก๊อป .exe ไฟล์เดียวไปวางบนเครื่อง POS แล้วดับเบิลคลิก' -ForegroundColor Gray
Write-Host '  (มันจะคลาย scripts\ กับ scratch\ ออกมาข้างๆ ตัวเองแล้วเปิดเมนูให้)' -ForegroundColor DarkGray
Write-Host ''
