# Test PlayerService with 2023 season data
Write-Host "Testing PlayerService with 2023 season..." -ForegroundColor Cyan
Write-Host ""

# Sync 3 players from each league (15 total) for quick test
Write-Host "[1/2] Syncing football players (season 2023)..." -ForegroundColor Yellow
Write-Host "This will take about 1-2 minutes..." -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Method POST -Uri "http://localhost:8084/api/admin/players/sync/football?season=2023&playersPerLeague=3" -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "✓ Sync Response:" -ForegroundColor Green
    $data | ConvertTo-Json -Depth 3
    Write-Host ""
    
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Start-Sleep -Seconds 2

# Check stats
Write-Host "[2/2] Checking statistics..." -ForegroundColor Yellow
try {
    $statsResponse = Invoke-WebRequest -Uri "http://localhost:8084/api/admin/players/stats" -ErrorAction Stop
    Write-Host "✓ Statistics:" -ForegroundColor Green
    Write-Host ""
    Write-Host $statsResponse.Content -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Check the service logs to see API responses!" -ForegroundColor Cyan
Write-Host "Look for 'API returned X players for league Y' messages" -ForegroundColor Cyan
