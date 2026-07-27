# UPAW - keep dev servers running (auto-restart on crash)
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "UPAW - starting backend + frontend (auto-restart enabled)" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow
Write-Host ""

while ($true) {
  try {
    npm run dev
    $exitCode = $LASTEXITCODE
  } catch {
    $exitCode = 1
    Write-Host "Process error: $_" -ForegroundColor Red
  }

  if ($exitCode -eq 0) {
    Write-Host "Servers stopped normally." -ForegroundColor Yellow
    break
  }

  Write-Host "Servers stopped unexpectedly. Restarting in 3 seconds..." -ForegroundColor Red
  Start-Sleep -Seconds 3
}
