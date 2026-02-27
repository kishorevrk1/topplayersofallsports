# Test PlayerService in MOCK mode
Write-Host "Testing PlayerService with MOCK data..." -ForegroundColor Cyan
Write-Host "This will test AI integration without hitting API rate limits" -ForegroundColor Gray
Write-Host ""

# Sync 3 mock players per league (15 total)
Write-Host "[1/3] Syncing mock football players..." -ForegroundColor Yellow
Write-Host "This will generate mock data and real AI analysis (1-2 minutes)..." -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Method POST -Uri "http://localhost:8084/api/admin/players/sync/football?season=2023&playersPerLeague=3" -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "✓ Sync Response:" -ForegroundColor Green
    Write-Host "  Players synced: $($data.playersSynced)" -ForegroundColor White
    Write-Host "  Message: $($data.message)" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Start-Sleep -Seconds 2

# Check stats
Write-Host "[2/3] Checking statistics..." -ForegroundColor Yellow
try {
    $statsResponse = Invoke-WebRequest -Uri "http://localhost:8084/api/admin/players/stats" -ErrorAction Stop
    Write-Host "✓ Statistics:" -ForegroundColor Green
    Write-Host ""
    Write-Host $statsResponse.Content -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Get top players
Write-Host "[3/3] Getting top-rated players..." -ForegroundColor Yellow
try {
    $topPlayersResponse = Invoke-WebRequest -Uri "http://localhost:8084/api/players/top?sport=FOOTBALL" -ErrorAction Stop
    $topPlayers = $topPlayersResponse.Content | ConvertFrom-Json
    
    if ($topPlayers.Count -gt 0) {
        Write-Host "✓ Found $($topPlayers.Count) players with AI analysis!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Top 3 AI-Rated Players:" -ForegroundColor Cyan
        
        $topPlayers | Select-Object -First 3 | ForEach-Object {
            Write-Host "  → $($_.player.name)" -ForegroundColor White
            Write-Host "    Rating: $($_.aiRating)/100" -ForegroundColor Yellow
            Write-Host "    Team: $($_.player.team)" -ForegroundColor Gray
            if ($_.analysisText -and $_.analysisText.Length -gt 0) {
                $preview = if ($_.analysisText.Length -gt 100) { $_.analysisText.Substring(0, 100) + "..." } else { $_.analysisText }
                Write-Host "    Analysis: $preview" -ForegroundColor Gray
            }
            Write-Host ""
        }
    } else {
        Write-Host "⚠ No players found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  MOCK Mode Testing Complete!" -ForegroundColor Green
Write-Host "  View Swagger: http://localhost:8084/swagger-ui.html" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Cyan
