[CmdletBinding()]
param(
    [string]$Message = "chore: manual save $(Get-Date -Format 'yyyy-MM-dd HH:mm')",
    [string]$RepoPath,
    [switch]$NoPush
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
if (-not $RepoPath) { $RepoPath = Split-Path -Parent $PSScriptRoot }

function Invoke-Git {
    param([Parameter(Mandatory)][string[]]$Arguments)

    $output = & git -C $RepoPath @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw ((@($output) | ForEach-Object { [string]$_ }) -join "`n").Trim()
    }
    return @($output)
}

if (-not (Test-Path (Join-Path $RepoPath '.git'))) {
    throw "Missing .git at $RepoPath. Run git init and configure origin first."
}

$forbiddenPattern = '(^|/)\.env($|\.(?!example))|(^|/)pg-data|(^|/)backups/|^data/|^uploads/|\.(dump|sqlite3?|mdb|pfx|pem|key)$|auto_backup_.*\.json$'
$statusBefore = @(Invoke-Git @('status', '--short', '--untracked-files=all'))
if ($statusBefore.Count -eq 0) {
    Write-Host 'No changes to save.' -ForegroundColor Yellow
    exit 0
}

Invoke-Git @('add', '-A') | Out-Null
$staged = @(Invoke-Git @('diff', '--cached', '--name-only')) | Where-Object { $_ }
$leaked = @($staged | Where-Object { $_ -match $forbiddenPattern })
if ($leaked.Count -gt 0) {
    git -C $RepoPath reset | Out-Null
    throw "Save cancelled: forbidden files found: $($leaked -join ', ')"
}

$largeFiles = @($staged | Where-Object {
    $path = Join-Path $RepoPath $_
    (Test-Path $path) -and ((Get-Item $path).Length -gt 90MB)
})
if ($largeFiles.Count -gt 0) {
    git -C $RepoPath reset | Out-Null
    throw "Save cancelled: files larger than 90MB: $($largeFiles -join ', ')"
}

Invoke-Git @('commit', '-m', $Message) | ForEach-Object { Write-Host $_ }

if (-not $NoPush) {
    $branch = ((Invoke-Git @('branch', '--show-current')) -join '').Trim()
    if (-not $branch) { throw 'Cannot determine the current branch.' }
    Invoke-Git @('push', '-u', 'origin', $branch) | ForEach-Object { Write-Host $_ }
    Write-Host "Saved and pushed to GitHub: $branch" -ForegroundColor Green
} else {
    Write-Host 'Saved locally (not pushed).' -ForegroundColor Green
}