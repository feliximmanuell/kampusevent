param(
    [int]$Port = 80,
    [int]$Retries = 15
)

$ErrorActionPreference = 'Continue'
$url = "http://localhost:$Port/healthz"

Write-Host "== Status container ==" -ForegroundColor Cyan
docker compose ps

Write-Host "`n== Menunggu aplikasi sehat di $url ==" -ForegroundColor Cyan
$ok = $false

for ($i = 1; $i -le $Retries; $i++) {
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "OK: $($response.Content)" -ForegroundColor Green
            $ok = $true
            break
        }
    } catch {
        Write-Host "Percobaan $i/$Retries gagal..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
    }
}

if (-not $ok) {
    Write-Host "`nAplikasi tidak sehat. Log terakhir:" -ForegroundColor Red
    docker compose logs --no-color --tail 80
    exit 1
}

Write-Host "`n== Ringkasan ==" -ForegroundColor Cyan
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
Write-Host "Smoke test selesai." -ForegroundColor Green
