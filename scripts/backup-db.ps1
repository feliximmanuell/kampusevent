param(
    [string]$OutputDir = "backups"
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$fileName = "kampusevent-$timestamp.sql"
$path = Join-Path $OutputDir $fileName

Write-Host "Membuat backup database ke $path ..." -ForegroundColor Cyan

$dump = docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backup gagal: pg_dump mengembalikan kode $LASTEXITCODE." -ForegroundColor Red
    exit 1
}

if (-not $dump) {
    Write-Host "Backup gagal: tidak ada output dari pg_dump." -ForegroundColor Red
    exit 1
}

[System.IO.File]::WriteAllText($path, ($dump -join "`n"), [System.Text.UTF8Encoding]::new($false))

Write-Host "Backup selesai: $path" -ForegroundColor Green
